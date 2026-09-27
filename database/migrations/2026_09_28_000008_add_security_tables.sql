-- ============================================================================
-- Migration: 2026_09_28_000008
-- Description: Add security tables (sessions, failed_login_attempts,
--              audit_logs, rate_limits) + user security fields
-- ============================================================================

-- 1) إضافة حقول الأمان إلى users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) جدول الجلسات
CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sessions_token UNIQUE (token),
  CONSTRAINT fk_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- 3) جدول محاولات الدخول الفاشلة
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  reason VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email 
  ON failed_login_attempts (email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip 
  ON failed_login_attempts (ip);
CREATE INDEX IF NOT EXISTS idx_failed_login_created_at 
  ON failed_login_attempts (created_at);

-- 4) جدول سجل الأنشطة
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id BIGINT,
  metadata JSONB,
  ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_audit_logs_admin_id 
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- 5) جدول تحديد المعدل
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  CONSTRAINT uq_rate_limits_key UNIQUE (key)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until 
  ON rate_limits (blocked_until);