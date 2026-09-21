-- ============================================================================
--  Migration : 2026_09_21_000003_kyc_full_support.sql
--  Project   : mnste9 — منصة العمل الحر العربية
--  DBMS      : PostgreSQL 11+
--  Purpose   : دعم KYC الكامل: ثلاث وثائق (أمامي / خلفي / سيلفي)
--              + بيانات المراجعة (سبب الرفض، المراجِع، تاريخ المراجعة).
--  Depends on: 2026_09_19_000001_create_platform_tables.sql
--
--  Design    :
--    * توسيع تراكمي (إضافي فقط): ADD COLUMN IF NOT EXISTS — لا يمسّ أي
--      عمود أو قيد قائم، والملف قابل لإعادة التنفيذ (idempotent).
--    * الأعمدة الجديدة كلها NULL: الطلبات المفردة القديمة تبقى صالحة
--      (مسارها في encrypted_file_path)، والطلبات الجديدة تخزّن المسارات
--      الثلاثة المشفّرة (AES-256-GCM) في الأعمدة المخصصة.
--    * reviewed_by بلا قيد FK عمداً: سجل تدقيقي تاريخي — يبقى أثر المراجعة
--      حتى لو حُذف حساب المشرف لاحقاً (نفس فلسفة ON DELETE RESTRICT
--      المالية دون منع الحذف النهائي).
--    * القاعدة الذهبية (تطبَّق في طبقة الإجراءات لا في القاعدة):
--      KYC إلزامي للمستقلين فقط — لتقديم العروض واستلام الدفعات والسحب؛
--      ولا يُطلب من أصحاب العمل إطلاقاً.
--    * الملف يُنفَّذ داخل معاملة واحدة (BEGIN ... COMMIT).
-- ============================================================================

BEGIN;

ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS front_file_path TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS back_file_path TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS selfie_file_path TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS reviewed_by BIGINT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMIT;

-- ============================================================================
-- Rollback — للتنفيذ اليدوي عند التراجع عن هذه الهجرة (غير مُنفَّذ تلقائياً)
-- ============================================================================
-- ALTER TABLE kyc_documents
--     DROP COLUMN IF EXISTS reviewed_at,
--     DROP COLUMN IF EXISTS reviewed_by,
--     DROP COLUMN IF EXISTS rejection_reason,
--     DROP COLUMN IF EXISTS selfie_file_path,
--     DROP COLUMN IF EXISTS back_file_path,
--     DROP COLUMN IF EXISTS front_file_path;
