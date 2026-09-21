-- ============================================================================
--  Migration : 2026_09_21_000004_create_contracts.sql
--  Project   : mnste9 — منصة العمل الحر العربية
--  DBMS      : PostgreSQL 11+
--  Purpose   : إنشاء جدول العقود (contracts) — يربط المشروع والعرض
--              مع مبلغ الضمان ونسبة العمولة والعمولة والصافي وحالة العقد.
--  Depends on: 2026_09_19_000001_create_platform_tables.sql
--
--  Design    :
--    * جدول contracts هو جوهر المرحلة التاسعة: عند قبول العرض يُنشأ عقد
--      واحد، ويُحجز المبلغ من محفظة العميل (balance → pending_balance).
--    * commission_rate محفوظ في العقد نفسه (NUMERIC(5,4) افتراضي 0.15)
--      ليتسنّى تغيير النسبة مستقبلاً دون المساس بالعقود التاريخية، وتستخدمه
--      خدمة الضمان عند التحرير (القاعدة الذهبية للمرحلة 9).
--    * commission و net_amount محسوبان ومخزنان عند الإنشاء لتسهيل
--      التقارير المالية والتدقيق.
--    * escrow_locked_at و released_at لتتبع زمن الحجز والتحرير.
--    * proposal_id قابل لأن يكون NULL مع ON DELETE SET NULL للحفاظ على
--      أثر العقد حتى لو حُذف العرض.
--    * حالات العقد: pending (بانتظار الحجز) / active (نشط ومحجوز) /
--      completed (مكتمل ومحرر) / disputed (متنازع عليه) / cancelled (ملغى).
--    * Trigger تحديث updated_at يكمّل $onUpdate في Drizzle.
--    * الملف يُنفَّذ داخل معاملة واحدة (BEGIN ... COMMIT) لضمان الذرّية.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- contracts — العقود بين العميل والمستقل بعد قبول العرض
-- ----------------------------------------------------------------------------
CREATE TABLE contracts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  freelancer_id BIGINT NOT NULL,
  proposal_id BIGINT,
  amount NUMERIC(15,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  commission NUMERIC(15,2) NOT NULL,
  net_amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  escrow_locked_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_contracts_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_client_id FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_freelancer_id FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_proposal_id FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL,
  CONSTRAINT ck_contracts_amount_positive CHECK (amount > 0),
  CONSTRAINT ck_contracts_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 1),
  CONSTRAINT ck_contracts_net_amount_positive CHECK (net_amount > 0),
  CONSTRAINT ck_contracts_status CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled'))
);

CREATE TRIGGER trg_contracts_set_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_contracts_project_id ON contracts (project_id);
CREATE INDEX idx_contracts_client_id ON contracts (client_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts (freelancer_id);
CREATE INDEX idx_contracts_status ON contracts (status);

COMMIT;

-- ============================================================================
-- Rollback — للتنفيذ اليدوي عند التراجع عن هذه الهجرة (غير مُنفَّذ تلقائياً)
-- ============================================================================
-- DROP TABLE IF EXISTS contracts CASCADE;
