-- 1. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info | success | warning | error
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);

-- 2. جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant1_id BIGINT NOT NULL,
  participant2_id BIGINT NOT NULL,
  project_id BIGINT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_conversations_p1 FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_p2 FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT ck_conversations_participants CHECK (participant1_id != participant2_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations (participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations (participant2_id);

-- 3. جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);

-- 4. جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reviewer_id BIGINT NOT NULL,
  reviewed_id BIGINT NOT NULL,
  contract_id BIGINT,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewed FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT ck_reviews_rating CHECK (rating >= 1 AND rating <= 5)
);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews (reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id);

-- 5. جدول المفضلة
CREATE TABLE IF NOT EXISTS wishlist (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  item_type VARCHAR(20) NOT NULL, -- project | freelancer
  item_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_wishlist_item_type CHECK (item_type IN ('project', 'freelancer')),
  CONSTRAINT uq_wishlist_user_item UNIQUE (user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist (user_id);

-- 6. جدول إعدادات المنصة
CREATE TABLE IF NOT EXISTS platform_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إضافة نسبة العمولة الافتراضية
INSERT INTO platform_settings (key, value, description)
VALUES ('commission_rate', '0.15', 'نسبة عمولة المنصة الافتراضية')
ON CONFLICT (key) DO NOTHING;
