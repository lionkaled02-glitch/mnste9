-- ============================================================================
--  Migration : 2026_09_21_000004_create_contracts.sql
--  Project   : mnste9 — منصة العمل الحر العربية
--  DBMS      : PostgreSQL 11+
--  Purpose   : إنشاء جدول العقود (contracts) — يربط المشروع والعرض
--              مع مبلغ الضمان ونسبة العمولة وحالة العقد ومعاملات الضمان.
--  Depends on: 2026_09_19_000001_create_platform_tables.sql
--
--  Design    :
--    * جدول contracts هو جوهر المرحلة التاسعة: عند قبول العرض يُنشأ عقد
--      واحد لكل عرض (UNIQUE على proposal_id)، ويُحجز المبلغ من محفظة
--      العميل (balance → pending_balance) عبر خدمة الضمان.
--    * commission_rate محفوظ في العقد نفسه (NUMERIC(5,4) افتراضي 0.15)
--      ليتسنّى تغيير النسبة مستقبلاً دون المساس بالعقود التاريخية، وتستخدمه
--      خدمة الضمان عند التحرير (القاعدة الذهبية للمرحلة 9).
--    * escrow_transaction_id و release_transaction_id مرجعان إلى
--      transactions (SET NULL عند الحذف النادر — الحفاظ على أثر العقد
--      حتى لو حُذفت الحركة يدوياً من الإدارة، مع بقاء المسار التدقيقي).
--    * حالات العقد: pending (بانتظار الحجز) / active (نشط ومحجوز) /
--      completed (مكتمل ومحرر) / cancelled (ملغى) / disputed (متنازع عليه).
--    * Trigger تحديث updated_at يكمّل $onUpdate في Drizzle.
--    * الملف يُنفَّذ داخل معاملة واحدة (BEGIN ... COMMIT) لضمان الذرّية.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- contracts — العقود بين العميل والمستقل بعد قبول العرض
-- ----------------------------------------------------------------------------
CREATE TABLE contracts (
    id                      BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id              BIGINT        NOT NULL,
    proposal_id             BIGINT        NOT NULL,
    client_id               BIGINT        NOT NULL,
    freelancer_id           BIGINT        NOT NULL,
    amount                  NUMERIC(15,2) NOT NULL,
    commission_rate         NUMERIC(5,4)  NOT NULL DEFAULT 0.15,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'active',
    escrow_transaction_id   BIGINT        NULL,
    release_transaction_id  BIGINT        NULL,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_contracts_proposal_id UNIQUE (proposal_id),

    CONSTRAINT ck_contracts_amount_positive
        CHECK (amount > 0),

    CONSTRAINT ck_contracts_commission_rate_range
        CHECK (commission_rate >= 0 AND commission_rate < 1),

    CONSTRAINT ck_contracts_status
        CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'disputed')),

    CONSTRAINT fk_contracts_project_id FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE RESTRICT,

    CONSTRAINT fk_contracts_proposal_id FOREIGN KEY (proposal_id)
        REFERENCES proposals (id) ON DELETE RESTRICT,

    CONSTRAINT fk_contracts_client_id FOREIGN KEY (client_id)
        REFERENCES users (id) ON DELETE RESTRICT,

    CONSTRAINT fk_contracts_freelancer_id FOREIGN KEY (freelancer_id)
        REFERENCES users (id) ON DELETE RESTRICT,

    CONSTRAINT fk_contracts_escrow_transaction_id FOREIGN KEY (escrow_transaction_id)
        REFERENCES transactions (id) ON DELETE SET NULL,

    CONSTRAINT fk_contracts_release_transaction_id FOREIGN KEY (release_transaction_id)
        REFERENCES transactions (id) ON DELETE SET NULL
);

CREATE TRIGGER trg_contracts_set_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- الفهارس (B-Tree) — لتسريع استعلامات لوحة التحكم «عقودي»
-- ----------------------------------------------------------------------------
CREATE INDEX idx_contracts_project_id     ON contracts (project_id);
CREATE INDEX idx_contracts_proposal_id    ON contracts (proposal_id);
CREATE INDEX idx_contracts_client_id      ON contracts (client_id);
CREATE INDEX idx_contracts_freelancer_id  ON contracts (freelancer_id);
CREATE INDEX idx_contracts_status         ON contracts (status);
CREATE INDEX idx_contracts_created_at     ON contracts (created_at DESC);

COMMIT;

-- ============================================================================
-- Rollback — للتنفيذ اليدوي عند التراجع عن هذه الهجرة (غير مُنفَّذ تلقائياً)
-- ============================================================================
-- DROP TABLE IF EXISTS contracts CASCADE;
