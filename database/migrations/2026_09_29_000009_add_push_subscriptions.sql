-- ============================================================================
-- Migration: 2026_09_29_000009
-- Description: Add push_subscriptions table for Web Push Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_push_endpoint UNIQUE (endpoint),
  CONSTRAINT fk_push_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_user_id 
  ON push_subscriptions (user_id);