-- create_all_tables.sql
-- Complete PostgreSQL schema for Matrimonial Backend
-- Generated from Sequelize models in src/models/
-- Usage: psql -d your_database_name -f create_all_tables.sql
-- Order: Core tables first, then dependent/interaction tables
-- All tables use IF NOT EXISTS for idempotency
-- Run once to bootstrap database schema

-- ========================================
-- CORE USER TABLES
-- ========================================

-- 1. users (from user.model.js)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ,
  CONSTRAINT chk_email_mobile CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. user_profiles (from userProfile.model.js)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  dob DATE,
  birth_time TIME,
  height_cm INTEGER CHECK (height_cm >= 100 AND height_cm <= 250),
  weight_kg INTEGER CHECK (weight_kg >= 30 AND weight_kg <= 150),
  marital_status VARCHAR(50),
  religion VARCHAR(50),
  caste VARCHAR(100),
  mother_tongue VARCHAR(50),
  about_me TEXT,
  occupation VARCHAR(150),
  location VARCHAR(255),
  education VARCHAR(150),
  income VARCHAR(100),
  phone VARCHAR(20),
  profile_image VARCHAR(500),
  profile_images TEXT,  -- JSON array of image URLs
  biodata_pdf VARCHAR(500),
  is_online BOOLEAN NOT NULL DEFAULT false
);

-- 3. subscription_plans (from subscriptionPlan.model.js)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0)
);

-- ========================================
-- 1:1 USER EXTENSION TABLES
-- ========================================

-- 4. user_addresses (from userAddress.model.js)
CREATE TABLE IF NOT EXISTS user_addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('present', 'permanent', 'both')),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(10)
);
CREATE INDEX IF NOT EXISTS ix_user_addresses_user_id ON user_addresses(user_id);

-- 5. user_education (from userEducation.model.js)
CREATE TABLE IF NOT EXISTS user_education (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qualification VARCHAR(100),
  college VARCHAR(150),
  university VARCHAR(150),
  passing_year INTEGER CHECK (passing_year BETWEEN 1900 AND 2100),
  highest BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_user_education_user_id ON user_education(user_id);

-- 6. user_family (inferred from seed_dummy_100_users.sql + models)
CREATE TABLE IF NOT EXISTS user_family (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  father_name VARCHAR(100),
  father_occupation VARCHAR(150),
  father_company_or_business VARCHAR(255),
  mother_name VARCHAR(100),
  mother_occupation VARCHAR(150),
  family_type VARCHAR(50) CHECK (family_type IN ('Nuclear', 'Joint')),
  siblings INTEGER CHECK (siblings >= 0),
  family_values VARCHAR(100),
  family_status VARCHAR(100),
  family_native_place VARCHAR(255)
);

-- 7. user_lifestyle (from model snippet)
CREATE TABLE IF NOT EXISTS user_lifestyle (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  diet VARCHAR(50),
  smoking VARCHAR(50),
  drinking VARCHAR(50),
  hobbies TEXT,
  interests TEXT
);

-- 8. user_profession (inferred from seed)
CREATE TABLE IF NOT EXISTS user_profession (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  occupation_type VARCHAR(150),
  designation VARCHAR(150),
  company_or_business VARCHAR(255),
  annual_income VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  working_country VARCHAR(100) DEFAULT 'India'
);

-- 9. user_kundlis (from userKundli.model.js)
CREATE TABLE IF NOT EXISTS user_kundlis (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  dob DATE,
  birth_time TIME,
  birth_place VARCHAR(255),
  moon_sign VARCHAR(50),
  nakshatra VARCHAR(50),
  manglik BOOLEAN,
  gotra VARCHAR(100),
  rashi VARCHAR(50),
  charan INTEGER,
  gan VARCHAR(50),
  nadi VARCHAR(50)
);

-- 10. partner_preferences (from partnerPreference.model.js)
CREATE TABLE IF NOT EXISTS partner_preferences (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_age INTEGER CHECK (min_age >= 18),
  max_age INTEGER CHECK (max_age <= 70 AND max_age > min_age),
  min_height_cm INTEGER,
  max_height_cm INTEGER CHECK (max_height_cm > min_height_cm),
  religion VARCHAR(50),
  caste VARCHAR(100),
  education VARCHAR(150),
  occupation VARCHAR(150),
  location VARCHAR(255),
  income_range VARCHAR(100),
  mother_tongue VARCHAR(50),
  kundli_match_required BOOLEAN DEFAULT false,
  manglik_preference VARCHAR(20) DEFAULT 'both' CHECK (manglik_preference IN ('yes', 'no', 'both'))
);

-- ========================================
-- INTERACTIONS & MATCHING
-- ========================================

-- 11. interests (from interest.model.js)
CREATE TABLE IF NOT EXISTS interests (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'sent')),
  message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);
CREATE INDEX IF NOT EXISTS ix_interests_sender_receiver ON interests(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS ix_interests_status ON interests(status);

-- 12. shortlists (inferred from seed/models)
CREATE TABLE IF NOT EXISTS shortlists (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shortlisted_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, shortlisted_user_id)
);
CREATE INDEX IF NOT EXISTS ix_shortlists_user ON shortlists(user_id, shortlisted_user_id);

-- 13. profile_views (inferred from seed)
CREATE TABLE IF NOT EXISTS profile_views (
  id BIGSERIAL PRIMARY KEY,
  viewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ,
  UNIQUE(viewer_id, viewed_user_id)
);
CREATE INDEX IF NOT EXISTS ix_profile_views ON profile_views(viewer_id, viewed_user_id, viewed_at);

-- 14. blocked_users (inferred from seed)
CREATE TABLE IF NOT EXISTS blocked_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ,
  UNIQUE(user_id, blocked_user_id)
);
CREATE INDEX IF NOT EXISTS ix_blocked_users ON blocked_users(user_id, blocked_user_id);

-- 15. conversations (from conversation.model.js)
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ,
  UNIQUE(user1_id, user2_id)
);
CREATE INDEX IF NOT EXISTS ix_conversations_users ON conversations(user1_id, user2_id);

-- 16. messages (from message.model.js)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS ix_messages_sender ON messages(sender_id, is_read);

-- ========================================
-- SYSTEM & MONETIZATION
-- ========================================

-- 17. user_activities (from userActivity.model.js)
CREATE TABLE IF NOT EXISTS user_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_user_activities_user_action ON user_activities(user_id, action, created_at);

-- 18. user_push_tokens (inferred from search)
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS ix_user_push_tokens_user ON user_push_tokens(user_id);

-- 19. user_otps (inferred from search + seed)
CREATE TABLE IF NOT EXISTS user_otps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_user_otps_user_type ON user_otps(user_id, type);
CREATE INDEX IF NOT EXISTS ix_user_otps_expires ON user_otps(expires_at) WHERE NOT is_used;

-- 20. payment_transactions (from existing create_payment_transactions_table.sql + model)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  plan_code VARCHAR(100) NULL,
  razorpay_order_id VARCHAR(128) NULL,
  razorpay_payment_id VARCHAR(128) NULL,
  receipt VARCHAR(128) NULL,
  amount_paise BIGINT NULL,
  currency VARCHAR(10) NULL,
  status VARCHAR(64) NOT NULL,
  source VARCHAR(64) NOT NULL,
  event_type VARCHAR(100) NULL,
  verification_method VARCHAR(64) NULL,
  raw_payload TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for payment_transactions (from existing SQL)
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_transactions_razorpay_order_id
  ON payment_transactions (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_transactions_razorpay_payment_id
  ON payment_transactions (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_payment_transactions_user_id_created_at
  ON payment_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_payment_transactions_status_created_at
  ON payment_transactions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_payment_transactions_source_created_at
  ON payment_transactions (source, created_at DESC);

-- Summary
COMMENT ON TABLE users IS 'Core user authentication table';
COMMENT ON TABLE user_profiles IS 'Detailed matrimonial profiles';

-- Verify creation
-- SELECT schemaname||'.'||tablename AS table_full_name 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename LIKE 'user_%' OR tablename IN ('users', 'interests', 'shortlists', 'profile_views', 'blocked_users', 'conversations', 'messages', 'subscription_plans', 'payment_transactions')
-- ORDER BY tablename;

