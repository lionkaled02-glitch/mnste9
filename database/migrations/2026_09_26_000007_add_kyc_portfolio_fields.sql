-- ============================================================================
-- Migration: 2026_09_26_000007
-- Description: Add dynamic KYC fields + Portfolio V2 (images + attachment)
-- ============================================================================

-- 1) kyc_documents — حقول ديناميكية
ALTER TABLE kyc_documents 
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS issue_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS issue_place VARCHAR(200),
  ADD COLUMN IF NOT EXISTS extra_fields JSONB;

-- 2) portfolio_items — صور متعددة + مرفق
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS images JSONB,
  ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

-- 3) فهارس للبحث السريع (اختياري لكن مفيد)
CREATE INDEX IF NOT EXISTS idx_kyc_documents_document_number 
  ON kyc_documents (document_number);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_images 
  ON portfolio_items USING gin (images);