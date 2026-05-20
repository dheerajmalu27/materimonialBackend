-- create_all_tables_mysql.sql
-- Complete MySQL schema for Matrimonial Backend
-- Generated from Sequelize models in src/models/
-- Usage: mysql -u your_user -p your_database < create_all_tables_mysql.sql
-- Order: Core tables first, then dependent/interaction tables

SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- CORE USER TABLES
-- ========================================

-- 1. users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. user_profiles
DROP TABLE IF EXISTS user_profiles;
CREATE TABLE user_profiles (
  user_id BIGINT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  dob DATE,
  birth_time VARCHAR(50),
  height_cm INT,
  weight_kg INT,
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
  profile_images TEXT,
  biodata_pdf VARCHAR(500),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. subscription_plans
DROP TABLE IF EXISTS subscription_plans;
CREATE TABLE subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  duration_days INT NOT NULL,
  features JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 1:1 USER EXTENSION TABLES
-- ========================================

-- 4. user_addresses
DROP TABLE IF EXISTS user_addresses;
CREATE TABLE user_addresses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  address_type ENUM('present', 'permanent', 'both') NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(10),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_user_addresses_user_id ON user_addresses(user_id);

-- 5. user_education
DROP TABLE IF EXISTS user_education;
CREATE TABLE user_education (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  qualification VARCHAR(100),
  college VARCHAR(150),
  university VARCHAR(150),
  passing_year INT,
  highest BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_user_education_user_id ON user_education(user_id);

-- 6. user_family
DROP TABLE IF EXISTS user_family;
CREATE TABLE user_family (
  user_id BIGINT PRIMARY KEY,
  father_name VARCHAR(100),
  father_occupation VARCHAR(150),
  father_company_or_business VARCHAR(255),
  mother_name VARCHAR(100),
  mother_occupation VARCHAR(150),
  family_type VARCHAR(50),
  siblings INT,
  family_values VARCHAR(100),
  family_status VARCHAR(100),
  family_native_place VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. user_lifestyle
DROP TABLE IF EXISTS user_lifestyle;
CREATE TABLE user_lifestyle (
  user_id BIGINT PRIMARY KEY,
  diet VARCHAR(50),
  smoking VARCHAR(50),
  drinking VARCHAR(50),
  hobbies TEXT,
  interests TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. user_profession
DROP TABLE IF EXISTS user_profession;
CREATE TABLE user_profession (
  user_id BIGINT PRIMARY KEY,
  occupation_type VARCHAR(150),
  designation VARCHAR(150),
  company_or_business VARCHAR(255),
  annual_income VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  working_country VARCHAR(100) DEFAULT 'India',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. user_kundlis
DROP TABLE IF EXISTS user_kundlis;
CREATE TABLE user_kundlis (
  user_id BIGINT PRIMARY KEY,
  dob DATE,
  birth_time VARCHAR(50),
  birth_place VARCHAR(255),
  moon_sign VARCHAR(50),
  nakshatra VARCHAR(50),
  manglik BOOLEAN,
  gotra VARCHAR(100),
  rashi VARCHAR(50),
  charan INT,
  gan VARCHAR(50),
  nadi VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. partner_preferences
DROP TABLE IF EXISTS partner_preferences;
CREATE TABLE partner_preferences (
  user_id BIGINT PRIMARY KEY,
  min_age INT,
  max_age INT,
  min_height_cm INT,
  max_height_cm INT,
  religion VARCHAR(50),
  caste VARCHAR(100),
  education VARCHAR(150),
  occupation VARCHAR(150),
  location VARCHAR(255),
  income_range VARCHAR(100),
  mother_tongue VARCHAR(50),
  kundli_match_required BOOLEAN DEFAULT FALSE,
  manglik_preference VARCHAR(20) DEFAULT 'both',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INTERACTIONS & MATCHING
-- ========================================

-- 11. interests
DROP TABLE IF EXISTS interests;
CREATE TABLE interests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'sent') NOT NULL DEFAULT 'pending',
  message TEXT,
  viewer_viewed_at DATETIME NULL,
  sender_viewed_at DATETIME NULL,
  viewed_count BIGINT NOT NULL DEFAULT 0,
  request_type VARCHAR(20) NOT NULL DEFAULT 'interest',
  ui_status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_interest (sender_id, receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_interests_sender_receiver ON interests(sender_id, receiver_id);
CREATE INDEX ix_interests_status ON interests(status);
CREATE INDEX ix_interests_sender_receiver_ui_status ON interests(sender_id, receiver_id, ui_status, created_at DESC);
CREATE INDEX ix_interests_receiver_ui_status ON interests(receiver_id, ui_status, created_at DESC);

-- 12. shortlists
DROP TABLE IF EXISTS shortlists;
CREATE TABLE shortlists (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  shortlisted_user_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  favorite_level ENUM('Gold','Platinum','Diamond') NOT NULL DEFAULT 'Gold',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_saved_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shortlisted_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_shortlist (user_id, shortlisted_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_shortlists_user ON shortlists(user_id, shortlisted_user_id);
CREATE INDEX ix_shortlists_user_saved_at ON shortlists(user_id, created_at DESC);

-- 13. profile_views (legacy - kept, but UI counts should use profile_view_events)
DROP TABLE IF EXISTS profile_views;
CREATE TABLE profile_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  viewer_id BIGINT NOT NULL,
  viewed_user_id BIGINT NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (viewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_view (viewer_id, viewed_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_profile_views ON profile_views(viewer_id, viewed_user_id, viewed_at);

-- 13.1 profile_view_events (new)
DROP TABLE IF EXISTS profile_view_events;
CREATE TABLE profile_view_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  viewer_id BIGINT NOT NULL,
  viewed_user_id BIGINT NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'profile',
  metadata JSON NULL,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (viewed_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_pve_viewed_user_time ON profile_view_events(viewed_user_id, viewed_at DESC);
CREATE INDEX ix_pve_viewer_viewed_time ON profile_view_events(viewer_id, viewed_user_id, viewed_at DESC);

-- 14. blocked_users
DROP TABLE IF EXISTS blocked_users;
CREATE TABLE blocked_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  blocked_user_id BIGINT NOT NULL,
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255) NULL,
  details TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_block (user_id, blocked_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_blocked_users ON blocked_users(user_id, blocked_user_id);
CREATE INDEX ix_blocked_users_user_blocked_at ON blocked_users(user_id, blocked_at DESC);

-- 15. conversations
DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user1_id BIGINT NOT NULL,
  user2_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (user1_id, user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_conversations_users ON conversations(user1_id, user2_id);

-- 15.1 conversation_user_state (new)
DROP TABLE IF EXISTS conversation_user_state;
CREATE TABLE conversation_user_state (
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  unread_count INT NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at DATETIME NULL,
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_cus_user_unread ON conversation_user_state(user_id, unread_count);

-- 16. messages
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_messages_conversation ON messages(conversation_id, sent_at);
CREATE INDEX ix_messages_sender ON messages(sender_id, is_read);

-- 16.1 message_reads (new)
DROP TABLE IF EXISTS message_reads;
CREATE TABLE message_reads (
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_message_reads_user_time ON message_reads(user_id, read_at DESC);

-- ========================================
-- SYSTEM & MONETIZATION
-- ========================================

-- 17. user_activities
DROP TABLE IF EXISTS user_activities;
CREATE TABLE user_activities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_user_activities_user_action ON user_activities(user_id, action, created_at);

-- 18. user_push_tokens
DROP TABLE IF EXISTS user_push_tokens;
CREATE TABLE user_push_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  expo_push_token TEXT NOT NULL,
  fcm_token TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_push_token (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_user_push_tokens_user ON user_push_tokens(user_id);

-- 19. user_otps
DROP TABLE IF EXISTS user_otps;
CREATE TABLE user_otps (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_user_otps_user_type ON user_otps(user_id, type);
CREATE INDEX ix_user_otps_expires ON user_otps(expires_at);

-- 20. payment_transactions
DROP TABLE IF EXISTS payment_transactions;
CREATE TABLE payment_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
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
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE UNIQUE INDEX ux_payment_transactions_razorpay_order_id ON payment_transactions (razorpay_order_id);
CREATE UNIQUE INDEX ux_payment_transactions_razorpay_payment_id ON payment_transactions (razorpay_payment_id);
CREATE INDEX ix_payment_transactions_user_id_created_at ON payment_transactions (user_id, created_at DESC);
CREATE INDEX ix_payment_transactions_status_created_at ON payment_transactions (status, created_at DESC);
CREATE INDEX ix_payment_transactions_source_created_at ON payment_transactions (source, created_at DESC);

-- 20.1 user_subscriptions (new)
DROP TABLE IF EXISTS user_subscriptions;
CREATE TABLE user_subscriptions (
  user_id BIGINT PRIMARY KEY,
  plan_id BIGINT NOT NULL,
  status ENUM('active','paused','canceled','expired') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end DATETIME NOT NULL,
  canceled_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX ix_user_subscriptions_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20.2 user_settings (new)
DROP TABLE IF EXISTS user_settings;
CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  settings JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20.3 user_verifications + documents (new)
DROP TABLE IF EXISTS user_verifications;
CREATE TABLE user_verifications (
  user_id BIGINT PRIMARY KEY,
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  aadhaar_verified BOOLEAN NOT NULL DEFAULT FALSE,
  photo_verified BOOLEAN NOT NULL DEFAULT FALSE,
  income_verified BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS user_verification_documents;
CREATE TABLE user_verification_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  doc_type ENUM('aadhaar','photo','income') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX ix_uvd_user_doc (user_id, doc_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

