-- ============================================================================
--  Migration : 2026_09_21_000002_add_user_profile_fields.sql
--  Project   : mnste9 — منصة العمل الحر العربية
--  DBMS      : PostgreSQL 11+  (ENUM Types, NUMERIC, CHECK Constraints)
--  Purpose   : إضافة أعمدة الملف الشخصي وتفضيلات الإعدادات إلى جدول users:
--              phone / city / preferred_currency / skills / bio / hourly_rate
--              notify_email / notify_sms
--  Depends on: 2026_09_19_000001_create_platform_tables.sql
--
--  Design    :
--    * توسيع تراكمي (إضافي فقط): لا يعدّل ولا يحذف أي عمود أو قيد أو فهرس
--      قائم — كل التغييرات ADD COLUMN / ADD CONSTRAINT / CREATE TYPE.
--    * نوع currency_enum يقيد العملة المفضلة على USD | SAR حصراً — بنك
--      الكريمي لا يدعم الريال اليمني (YER). سيُستخدم النوع نفسه في المرحلة
--      القادمة لأرصدة المحفظة وحركاتها المالية.
--    * أعمدة الملف الشخصي كلها اختيارية (NULL) كي لا تمسّ أي صفوف قائمة؛
--      وعمودا تفضيلات الإشعارات NOT NULL بقيمة افتراضية TRUE (يستفيد منها
--      كل مستخدم قائم فوراً دون تحديث الصفوف).
--    * Trigger تحديث updated_at القائم على users (trg_users_set_updated_at)
--      يغطي الأعمدة الجديدة تلقائياً — لا حاجة لأي تغيير عليه.
--    * الملف يُنفَّذ داخل معاملة واحدة (BEGIN ... COMMIT) لضمان التطبيق الذرّي.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) نوع العملات المدعومة — دولار أمريكي أو ريال سعودي فقط (لا ريال يمني)
-- ============================================================================

CREATE TYPE currency_enum AS ENUM ('USD', 'SAR');

-- ============================================================================
-- 2) أعمدة الملف الشخصي وتفضيلات الإعدادات — إضافات على users
-- ============================================================================

ALTER TABLE users
    ADD COLUMN phone              VARCHAR(30)   NULL,                 -- رقم الهاتف (صيغة دولية مثل ‎+967…)
    ADD COLUMN city               VARCHAR(100)  NULL,                 -- المدينة
    ADD COLUMN preferred_currency currency_enum NULL,                 -- العملة المفضلة: USD | SAR حصراً
    ADD COLUMN skills             TEXT          NULL,                 -- مهارات المستقل (مفصولة بفواصل)
    ADD COLUMN bio                TEXT          NULL,                 -- نبذة مهنية (للمستقلين)
    ADD COLUMN hourly_rate        NUMERIC(15,2) NULL,                 -- السعر بالساعة بالدولار الأمريكي
    ADD COLUMN notify_email       BOOLEAN       NOT NULL DEFAULT TRUE, -- تفضيل إشعارات البريد الإلكتروني
    ADD COLUMN notify_sms         BOOLEAN       NOT NULL DEFAULT TRUE; -- تفضيل إشعارات الجوال (SMS)

-- السعر بالساعة (إن وُجد) موجب دائماً — قيد مساند لتحقق zod في التطبيق
ALTER TABLE users
    ADD CONSTRAINT ck_users_hourly_rate_positive
        CHECK (hourly_rate IS NULL OR hourly_rate > 0);

-- ============================================================================
-- 3) Rollback — للتنفيذ اليدوي عند التراجع عن هذه الهجرة (غير مُنفَّذ تلقائياً)
-- ============================================================================
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_hourly_rate_positive;
-- ALTER TABLE users
--     DROP COLUMN IF EXISTS notify_sms,
--     DROP COLUMN IF EXISTS notify_email,
--     DROP COLUMN IF EXISTS hourly_rate,
--     DROP COLUMN IF EXISTS bio,
--     DROP COLUMN IF EXISTS skills,
--     DROP COLUMN IF EXISTS preferred_currency,
--     DROP COLUMN IF EXISTS city,
--     DROP COLUMN IF EXISTS phone;
-- DROP TYPE IF EXISTS currency_enum;

COMMIT;
