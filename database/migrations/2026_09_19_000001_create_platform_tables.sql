-- ============================================================================
--  Migration : 2026_09_19_000001_create_platform_tables.sql
--  Project   : mnste9 — منصة العمل الحر العربية
--  DBMS      : PostgreSQL 11+  (ENUM Types, JSONB, IDENTITY Columns, Triggers)
--  Purpose   : إنشاء أنواع ENUM المخصصة والجداول الأساسية الست للمنصة:
--              users / wallets / transactions / projects / proposals / kyc_documents
--  Design    :
--    * الملف يُنفَّذ داخل معاملة واحدة (BEGIN ... COMMIT) لضمان التطبيق الذرّي.
--    * يُنصح باعتماد الحذف الناعم (Soft Delete) للمستخدمين بدلاً من الحذف الفعلي؛
--      لذلك استُخدم ON DELETE RESTRICT في الجداول المالية للحفاظ على المسار
--      التدقيقي، وON DELETE CASCADE لوثائق KYC (بيانات شخصية تُمحى مع صاحبها).
--    * لتوسيع أي نوع ENUM مستقبلاً: ALTER TYPE <name> ADD VALUE '<value>';
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) أنواع ENUM المخصصة (Custom ENUM Types)
-- ============================================================================

-- طرق الدفع المدعومة حصراً: الكريمي (حوالات محلية) + PayPal
CREATE TYPE payment_method_enum     AS ENUM ('kuraimi', 'paypal');

-- حالات المعاملة المالية
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- أنواع الحركات على المحفظة: إيداع / سحب / احتجاز ضمان / تحرير ضمان / عمولة المنصة
CREATE TYPE transaction_type_enum   AS ENUM ('deposit', 'withdrawal', 'escrow_lock', 'escrow_release', 'commission');

-- حالات المشروع
CREATE TYPE project_status_enum     AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- ============================================================================
-- 2) دالة مساعدة: تحديث عمود updated_at تلقائياً عند كل تعديل
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER
    LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 3) الجداول والقيود (Tables & Constraints)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1) users — المستخدمون (عميل / مستقل / مشرف)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(255)  NOT NULL,
    password        VARCHAR(255)  NOT NULL,               -- تجزئة كلمة المرور (bcrypt / argon2)
    role            VARCHAR(20)   NOT NULL,               -- client | freelancer | admin
    is_kyc_verified BOOLEAN       NOT NULL DEFAULT FALSE, -- نتيجة توثيق الهوية (KYC)
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),  -- ملاحظة: طبّع الإيميل إلى أحرف صغيرة في التطبيق قبل الإدخال/البحث
    CONSTRAINT ck_users_role  CHECK (role IN ('client', 'freelancer', 'admin'))
);

CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3.2) wallets — المحافظ (محفظة واحدة لكل مستخدم، والرصيد لا يكون سالباً أبداً)
-- ----------------------------------------------------------------------------
CREATE TABLE wallets (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    balance         NUMERIC(15,2) NOT NULL DEFAULT 0.00,  -- الرصيد المتاح
    pending_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,  -- الرصيد المعلّق (محتجز كضمان Escrow)
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wallets_user_id UNIQUE (user_id),  -- محفظة واحدة لكل مستخدم (يُنشئ فهرس B-Tree على user_id تلقائياً)
    CONSTRAINT ck_wallets_balance_non_negative         CHECK (balance >= 0),
    CONSTRAINT ck_wallets_pending_balance_non_negative CHECK (pending_balance >= 0),
    CONSTRAINT fk_wallets_user_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT  -- لا يُحذف مستخدم له محفظة إلا بعد معالجة السجلات المالية
);

CREATE TRIGGER trg_wallets_set_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3.3) transactions — الحركات المالية (إيداع، سحب، ضمان، عمولة)
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id             BIGINT                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT                  NOT NULL,      -- صاحب الحركة
    amount         NUMERIC(15,2)           NOT NULL,      -- موجب دائماً؛ الاتجاه يحدده عمود type
    type           transaction_type_enum   NOT NULL,
    payment_method payment_method_enum     NULL,          -- NULL للحركات الداخلية (Escrow / العمولة)
    status         transaction_status_enum NOT NULL DEFAULT 'pending',
    reference_id   VARCHAR(255)            NULL,          -- رقم حوالة الكريمي أو معرّف طلب PayPal
    meta           JSONB                   NULL,          -- بيانات إضافية مرنة (تفاصيل الحوالة، الرسوم، ...)
    created_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT fk_transactions_user_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT  -- الحفاظ على المسار التدقيقي المالي
);

CREATE TRIGGER trg_transactions_set_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3.4) projects — المشاريع التي ينشرها العملاء
-- ----------------------------------------------------------------------------
CREATE TABLE projects (
    id            BIGINT              GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id     BIGINT              NOT NULL,           -- صاحب المشروع (مرجع إلى users)
    title         VARCHAR(255)        NOT NULL,
    description   TEXT                NOT NULL,
    budget_min    NUMERIC(15,2)       NOT NULL,
    budget_max    NUMERIC(15,2)       NOT NULL,
    duration_days INTEGER             NOT NULL,           -- المدة المتوقعة للتنفيذ بالأيام
    status        project_status_enum NOT NULL DEFAULT 'open',
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_projects_budget_min_non_negative CHECK (budget_min >= 0),
    CONSTRAINT ck_projects_budget_max_non_negative CHECK (budget_max >= 0),
    CONSTRAINT ck_projects_budget_range            CHECK (budget_max >= budget_min),
    CONSTRAINT ck_projects_duration_positive       CHECK (duration_days > 0),
    CONSTRAINT fk_projects_client_id FOREIGN KEY (client_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_projects_set_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3.5) proposals — عروض المستقلين على المشاريع (عرض واحد لكل مستقل في المشروع)
-- ----------------------------------------------------------------------------
CREATE TABLE proposals (
    id            BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id    BIGINT        NOT NULL,
    freelancer_id BIGINT        NOT NULL,                 -- المستقل صاحب العرض (مرجع إلى users)
    amount        NUMERIC(15,2) NOT NULL,                 -- المبلغ المعروض للتنفيذ
    duration_days INTEGER       NOT NULL,                 -- مدة التنفيذ المقترحة بالأيام
    comment       TEXT          NULL,                     -- رسالة العرض (اختيارية)
    status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_proposals_project_freelancer UNIQUE (project_id, freelancer_id),  -- منع تكرار عرض نفس المستقل على نفس المشروع
    CONSTRAINT ck_proposals_amount_positive    CHECK (amount > 0),
    CONSTRAINT ck_proposals_duration_positive  CHECK (duration_days > 0),
    CONSTRAINT ck_proposals_status             CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT fk_proposals_project_id FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,  -- حذف المشروع يحذف عروضه المرتبطة
    CONSTRAINT fk_proposals_freelancer_id FOREIGN KEY (freelancer_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_proposals_set_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3.6) kyc_documents — وثائق توثيق الهوية (الملفات تُخزن مشفّرة خارج قاعدة البيانات)
-- ----------------------------------------------------------------------------
CREATE TABLE kyc_documents (
    id                  BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT      NOT NULL,
    encrypted_file_path TEXT        NOT NULL,             -- مسار/مفتاح الملف المشفّر في التخزين الخارجي
    document_type       VARCHAR(50) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_kyc_documents_document_type CHECK (document_type IN ('national_id', 'passport', 'driver_license', 'other')),
    CONSTRAINT ck_kyc_documents_status        CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT fk_kyc_documents_user_id FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE  -- بيانات شخصية حساسة: تُمحى مع حساب المستخدم
);

CREATE TRIGGER trg_kyc_documents_set_updated_at
    BEFORE UPDATE ON kyc_documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 4) الفهارس (B-Tree Indexes)
--    ملاحظة: فهرس user_id في جدول wallets يوفّره قيد UNIQUE (uq_wallets_user_id) تلقائياً
-- ============================================================================

-- transactions
CREATE INDEX idx_transactions_user_id      ON transactions (user_id);
CREATE INDEX idx_transactions_status       ON transactions (status);
CREATE INDEX idx_transactions_reference_id ON transactions (reference_id);
CREATE INDEX idx_transactions_meta         ON transactions USING GIN (meta);  -- بحث مرن داخل JSONB

-- projects
CREATE INDEX idx_projects_client_id ON projects (client_id);
CREATE INDEX idx_projects_status    ON projects (status);

-- proposals
CREATE INDEX idx_proposals_project_id    ON proposals (project_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals (freelancer_id);
CREATE INDEX idx_proposals_status        ON proposals (status);

-- kyc_documents
CREATE INDEX idx_kyc_documents_user_id ON kyc_documents (user_id);
CREATE INDEX idx_kyc_documents_status  ON kyc_documents (status);

-- ============================================================================
-- 5) Rollback — للتنفيذ اليدوي عند التراجع عن هذه الهجرة (غير مُنفَّذ تلقائياً)
-- ============================================================================
-- DROP TABLE IF EXISTS kyc_documents CASCADE;
-- DROP TABLE IF EXISTS proposals      CASCADE;
-- DROP TABLE IF EXISTS projects       CASCADE;
-- DROP TABLE IF EXISTS transactions   CASCADE;
-- DROP TABLE IF EXISTS wallets        CASCADE;
-- DROP TABLE IF EXISTS users          CASCADE;
-- DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
-- DROP TYPE IF EXISTS project_status_enum;
-- DROP TYPE IF EXISTS transaction_type_enum;
-- DROP TYPE IF EXISTS transaction_status_enum;
-- DROP TYPE IF EXISTS payment_method_enum;

COMMIT;
