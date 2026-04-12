-- Seed script: 100 dummy users (50 male + 50 female) with linked data across core tables
-- Usage:
--   1) Open psql connected to your DB
--   2) Run: \i seed_dummy_100_users.sql
--
-- Notes:
-- - This script inserts a NEW unique batch each run (safe to run multiple times).
-- - Includes data for: users, user_profiles, user_addresses, user_education,
--   user_family, user_lifestyle, user_profession, user_kundlis,
--   partner_preferences, user_activities, user_push_tokens, user_otps,
--   interests, shortlists, profile_views, blocked_users, conversations, messages.

BEGIN;

-- Optional plan seed (only if not present)
INSERT INTO subscription_plans (plan_name, price, duration_days)
SELECT p.plan_name, p.price, p.duration_days
FROM (
  VALUES
    ('free', 0, 3650),
    ('premium', 1200, 365)
) AS p(plan_name, price, duration_days)
WHERE NOT EXISTS (
  SELECT 1
  FROM subscription_plans sp
  WHERE sp.plan_name = p.plan_name
);

DROP TABLE IF EXISTS _seed_users;

CREATE TEMP TABLE _seed_users AS
WITH params AS (
  SELECT to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') AS run_id
),
source_rows AS (
  SELECT 'male'::text AS gender, gs AS seq
  FROM generate_series(1, 50) gs
  UNION ALL
  SELECT 'female'::text AS gender, gs AS seq
  FROM generate_series(1, 50) gs
),
inserted AS (
  INSERT INTO users (email, mobile, password_hash, gender, is_active, created_at)
  SELECT
    lower(format('dummy.%s.%s.%s@matrimony.test', sr.gender, lpad(sr.seq::text, 2, '0'), p.run_id)) AS email,
    CASE
      WHEN sr.gender = 'male' THEN '8' || substr(p.run_id, 1, 3) || lpad(sr.seq::text, 6, '0')
      ELSE '7' || substr(p.run_id, 1, 3) || lpad(sr.seq::text, 6, '0')
    END AS mobile,
    '$2b$10$7EqJtq98hPqEX7fNZaFWoOHi8f0I9rYg4n5Vf3L7hIwrKyYVJZZz6' AS password_hash,
    sr.gender AS gender,
    TRUE AS is_active,
    now() - (sr.seq || ' days')::interval AS created_at
  FROM source_rows sr
  CROSS JOIN params p
  RETURNING id, email, mobile, gender, created_at
)
SELECT
  i.id,
  i.email,
  i.mobile,
  i.gender,
  i.created_at,
  row_number() OVER (PARTITION BY i.gender ORDER BY i.id) AS seq
FROM inserted i;

-- user_profiles
INSERT INTO user_profiles (
  user_id, first_name, last_name, dob, birth_time,
  height_cm, weight_kg, marital_status,
  religion, caste, mother_tongue,
  about_me, occupation, location, education, income,
  phone, profile_image, profile_images, biodata_pdf, is_online
)
SELECT
  su.id,
  CASE WHEN su.gender = 'male' THEN 'Aarav' ELSE 'Anaya' END || su.seq,
  CASE (su.seq % 5)
    WHEN 0 THEN 'Sharma'
    WHEN 1 THEN 'Patel'
    WHEN 2 THEN 'Singh'
    WHEN 3 THEN 'Gupta'
    ELSE 'Verma'
  END,
  (current_date - ((22 + (su.seq % 10)) || ' years')::interval - ((su.seq % 25) || ' days')::interval)::date,
  ('06:00:00'::time + ((su.seq % 12) || ' hours')::interval)::time,
  CASE WHEN su.gender = 'male' THEN 165 + (su.seq % 18) ELSE 150 + (su.seq % 15) END,
  CASE WHEN su.gender = 'male' THEN 60 + (su.seq % 20) ELSE 48 + (su.seq % 18) END,
  CASE WHEN su.seq % 4 = 0 THEN 'Divorced' ELSE 'Never Married' END,
  CASE (su.seq % 4)
    WHEN 0 THEN 'Hindu'
    WHEN 1 THEN 'Muslim'
    WHEN 2 THEN 'Christian'
    ELSE 'Sikh'
  END,
  CASE (su.seq % 6)
    WHEN 0 THEN 'Brahmin'
    WHEN 1 THEN 'Rajput'
    WHEN 2 THEN 'General'
    WHEN 3 THEN 'Yadav'
    WHEN 4 THEN 'Aggarwal'
    ELSE 'Other'
  END,
  CASE (su.seq % 5)
    WHEN 0 THEN 'Hindi'
    WHEN 1 THEN 'English'
    WHEN 2 THEN 'Gujarati'
    WHEN 3 THEN 'Marathi'
    ELSE 'Punjabi'
  END,
  format('Hello! I am dummy %s profile #%s created for application QA testing.', su.gender, su.seq),
  CASE (su.seq % 7)
    WHEN 0 THEN 'Software Engineer'
    WHEN 1 THEN 'Doctor'
    WHEN 2 THEN 'Teacher'
    WHEN 3 THEN 'Business Owner'
    WHEN 4 THEN 'Banker'
    WHEN 5 THEN 'Designer'
    ELSE 'Manager'
  END,
  CASE (su.seq % 8)
    WHEN 0 THEN 'Mumbai - Maharashtra'
    WHEN 1 THEN 'Pune - Maharashtra'
    WHEN 2 THEN 'Bangalore - Karnataka'
    WHEN 3 THEN 'Delhi - Delhi NCR'
    WHEN 4 THEN 'Ahmedabad - Gujarat'
    WHEN 5 THEN 'Hyderabad - Telangana'
    WHEN 6 THEN 'Jaipur - Rajasthan'
    ELSE 'Lucknow - Uttar Pradesh'
  END,
  CASE (su.seq % 5)
    WHEN 0 THEN 'Bachelor''s Degree'
    WHEN 1 THEN 'Master''s Degree'
    WHEN 2 THEN 'Diploma'
    WHEN 3 THEN 'Doctorate/PhD'
    ELSE 'Professional Degree (CA/CS/CMA)'
  END,
  CASE (su.seq % 6)
    WHEN 0 THEN '₹3-4 Lakh'
    WHEN 1 THEN '₹5-7 Lakh'
    WHEN 2 THEN '₹7-10 Lakh'
    WHEN 3 THEN '₹10-15 Lakh'
    WHEN 4 THEN '₹15-20 Lakh'
    ELSE '₹20-25 Lakh'
  END,
  su.mobile,
  format('https://picsum.photos/seed/u%s/400/400', su.id),
  format('["https://picsum.photos/seed/u%sa/400/400","https://picsum.photos/seed/u%sb/400/400"]', su.id, su.id),
  NULL,
  FALSE
FROM _seed_users su;

-- user_addresses
INSERT INTO user_addresses (user_id, address_type, city, state, country, pincode)
SELECT
  su.id,
  'both',
  CASE (su.seq % 8)
    WHEN 0 THEN 'Mumbai'
    WHEN 1 THEN 'Pune'
    WHEN 2 THEN 'Bangalore'
    WHEN 3 THEN 'Delhi'
    WHEN 4 THEN 'Ahmedabad'
    WHEN 5 THEN 'Hyderabad'
    WHEN 6 THEN 'Jaipur'
    ELSE 'Lucknow'
  END,
  CASE (su.seq % 8)
    WHEN 0 THEN 'Maharashtra'
    WHEN 1 THEN 'Maharashtra'
    WHEN 2 THEN 'Karnataka'
    WHEN 3 THEN 'Delhi NCR'
    WHEN 4 THEN 'Gujarat'
    WHEN 5 THEN 'Telangana'
    WHEN 6 THEN 'Rajasthan'
    ELSE 'Uttar Pradesh'
  END,
  'India',
  lpad((100000 + su.seq)::text, 6, '0')
FROM _seed_users su;

-- user_education
INSERT INTO user_education (user_id, qualification, college, university, passing_year, highest)
SELECT
  su.id,
  CASE (su.seq % 5)
    WHEN 0 THEN 'B.Tech'
    WHEN 1 THEN 'MBA'
    WHEN 2 THEN 'MBBS'
    WHEN 3 THEN 'B.Com'
    ELSE 'MCA'
  END,
  format('Dummy College %s', su.seq),
  CASE (su.seq % 4)
    WHEN 0 THEN 'Delhi University'
    WHEN 1 THEN 'Mumbai University'
    WHEN 2 THEN 'Pune University'
    ELSE 'Bangalore University'
  END,
  2012 + (su.seq % 11),
  TRUE
FROM _seed_users su;

-- user_profession
INSERT INTO user_profession (user_id, occupation_type, designation, company_or_business, annual_income, currency, working_country)
SELECT
  su.id,
  CASE (su.seq % 6)
    WHEN 0 THEN 'Software Engineer'
    WHEN 1 THEN 'Doctor'
    WHEN 2 THEN 'Teacher'
    WHEN 3 THEN 'Business Owner'
    WHEN 4 THEN 'Manager'
    ELSE 'Analyst'
  END,
  CASE (su.seq % 6)
    WHEN 0 THEN 'Senior Engineer'
    WHEN 1 THEN 'Consultant'
    WHEN 2 THEN 'Professor'
    WHEN 3 THEN 'Founder'
    WHEN 4 THEN 'Team Lead'
    ELSE 'Specialist'
  END,
  format('Dummy Company %s', su.seq),
  CASE (su.seq % 6)
    WHEN 0 THEN '₹3-4 Lakh'
    WHEN 1 THEN '₹5-7 Lakh'
    WHEN 2 THEN '₹7-10 Lakh'
    WHEN 3 THEN '₹10-15 Lakh'
    WHEN 4 THEN '₹15-20 Lakh'
    ELSE '₹20-25 Lakh'
  END,
  'INR',
  'India'
FROM _seed_users su;

-- user_family
INSERT INTO user_family (
  user_id, father_name, father_occupation, father_company_or_business,
  mother_name, mother_occupation, family_type, siblings,
  family_values, family_status, family_native_place
)
SELECT
  su.id,
  format('Father %s', su.seq),
  CASE WHEN su.seq % 2 = 0 THEN 'Business Owner' ELSE 'Government Employee' END,
  format('Family Business %s', su.seq),
  format('Mother %s', su.seq),
  CASE WHEN su.seq % 3 = 0 THEN 'Teacher' ELSE 'Homemaker' END,
  CASE WHEN su.seq % 2 = 0 THEN 'Nuclear' ELSE 'Joint' END,
  (su.seq % 4)::text,
  CASE WHEN su.seq % 2 = 0 THEN 'Traditional' ELSE 'Moderate' END,
  CASE WHEN su.seq % 3 = 0 THEN 'Upper Middle Class' ELSE 'Middle Class' END,
  format('{"siblings":"%s","familyValues":"%s","familyStatus":"%s"}', (su.seq % 4)::text,
         CASE WHEN su.seq % 2 = 0 THEN 'Traditional' ELSE 'Moderate' END,
         CASE WHEN su.seq % 3 = 0 THEN 'Upper Middle Class' ELSE 'Middle Class' END)
FROM _seed_users su;

-- user_lifestyle
INSERT INTO user_lifestyle (user_id, diet, smoking, drinking, hobbies, interests)
SELECT
  su.id,
  CASE WHEN su.seq % 4 = 0 THEN 'Vegetarian' WHEN su.seq % 4 = 1 THEN 'Eggetarian' WHEN su.seq % 4 = 2 THEN 'Non-Vegetarian' ELSE 'Vegan' END,
  CASE WHEN su.seq % 5 = 0 THEN 'Occasionally' ELSE 'No' END,
  CASE WHEN su.seq % 4 = 0 THEN 'Occasionally' ELSE 'No' END,
  'Reading,Traveling,Music,Fitness',
  'Technology,Sports,Travel,Movies'
FROM _seed_users su;

-- user_kundlis
INSERT INTO user_kundlis (user_id, dob, birth_time, birth_place, moon_sign, nakshatra, manglik, gotra, rashi, charan, gan, nadi)
SELECT
  su.id,
  (current_date - ((22 + (su.seq % 10)) || ' years')::interval)::date,
  ('05:30:00'::time + ((su.seq % 12) || ' hours')::interval)::time,
  CASE (su.seq % 5)
    WHEN 0 THEN 'Mumbai'
    WHEN 1 THEN 'Pune'
    WHEN 2 THEN 'Delhi'
    WHEN 3 THEN 'Bangalore'
    ELSE 'Jaipur'
  END,
  CASE (su.seq % 4)
    WHEN 0 THEN 'Aries'
    WHEN 1 THEN 'Taurus'
    WHEN 2 THEN 'Gemini'
    ELSE 'Cancer'
  END,
  CASE (su.seq % 5)
    WHEN 0 THEN 'Ashwini'
    WHEN 1 THEN 'Bharani'
    WHEN 2 THEN 'Rohini'
    WHEN 3 THEN 'Hasta'
    ELSE 'Swati'
  END,
  (su.seq % 2 = 0),
  CASE WHEN su.seq % 2 = 0 THEN 'Kashyap' ELSE 'Bharadwaj' END,
  CASE (su.seq % 4)
    WHEN 0 THEN 'Mesh'
    WHEN 1 THEN 'Vrishabh'
    WHEN 2 THEN 'Mithun'
    ELSE 'Kark'
  END,
  ((su.seq % 4) + 1),
  CASE WHEN su.seq % 2 = 0 THEN 'Dev' ELSE 'Manushya' END,
  CASE WHEN su.seq % 2 = 0 THEN 'Adi' ELSE 'Madhya' END
FROM _seed_users su;

-- partner_preferences
INSERT INTO partner_preferences (
  user_id, min_age, max_age, min_height_cm, max_height_cm,
  religion, caste, education, occupation, location,
  income_range, mother_tongue, kundli_match_required, manglik_preference
)
SELECT
  su.id,
  21,
  34,
  150,
  190,
  CASE (su.seq % 4)
    WHEN 0 THEN 'Hindu'
    WHEN 1 THEN 'Muslim'
    WHEN 2 THEN 'Christian'
    ELSE 'Sikh'
  END,
  'General',
  'Bachelor''s Degree',
  'Software Engineer',
  'Mumbai - Maharashtra',
  '₹5-7 Lakh',
  'Hindi',
  FALSE,
  'both'
FROM _seed_users su;

-- user_activities (2 records per user)
INSERT INTO user_activities (user_id, action, description, ip_address, user_agent)
SELECT su.id, 'login', 'Dummy login activity', '127.0.0.1', 'seed-script/1.0'
FROM _seed_users su
UNION ALL
SELECT su.id, 'profile_update', 'Dummy profile update activity', '127.0.0.1', 'seed-script/1.0'
FROM _seed_users su;

-- user_push_tokens (1 per user)
INSERT INTO user_push_tokens (user_id, expo_push_token, updated_at)
SELECT
  su.id,
  format('ExponentPushToken[dummy-token-%s]', su.id),
  now()
FROM _seed_users su;

-- user_otps (1 active login OTP per user)
INSERT INTO user_otps (user_id, otp, type, expires_at, is_used, created_at, updated_at)
SELECT
  su.id,
  lpad(((100000 + su.seq) % 999999)::text, 6, '0'),
  'login',
  now() + interval '15 minutes',
  FALSE,
  now(),
  now()
FROM _seed_users su;

-- interests (40 pairs male -> female)
WITH males AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'male'
), females AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'female'
)
INSERT INTO interests (sender_id, receiver_id, status, message, created_at, updated_at)
SELECT
  m.id,
  f.id,
  CASE
      WHEN m.seq % 3 = 0 THEN 'accepted'
      WHEN m.seq % 3 = 1 THEN 'sent'
      ELSE 'pending'
  END,
  format('Hi from dummy male #%s', m.seq),
  now() - (m.seq || ' hours')::interval,
  now() - (m.seq || ' hours')::interval
FROM males m
JOIN females f ON f.seq = m.seq
WHERE m.seq <= 40;

-- shortlists (male -> female and some reverse)
WITH males AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'male'
), females AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'female'
)
INSERT INTO shortlists (user_id, shortlisted_user_id, created_at)
SELECT m.id, f.id, now() - (m.seq || ' days')::interval
FROM males m
JOIN females f ON f.seq = m.seq
WHERE m.seq <= 30
UNION ALL
SELECT f.id, m.id, now() - (f.seq || ' days')::interval
FROM males m
JOIN females f ON f.seq = m.seq
WHERE f.seq <= 20;

-- profile views (both directions)
WITH males AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'male'
), females AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'female'
)
INSERT INTO profile_views (viewer_id, viewed_user_id, viewed_at)
SELECT m.id, f.id, now() - (m.seq || ' hours')::interval
FROM males m
JOIN females f ON f.seq = m.seq
UNION ALL
SELECT f.id, m.id, now() - (f.seq || ' hours')::interval
FROM males m
JOIN females f ON f.seq = m.seq;

-- blocked users (small sample)
WITH males AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'male'
), females AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'female'
)
INSERT INTO blocked_users (user_id, blocked_user_id, blocked_at)
SELECT m.id, f.id, now() - interval '1 day'
FROM males m
JOIN females f ON f.seq = m.seq
WHERE m.seq <= 5;

-- conversations + messages
WITH males AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'male'
), females AS (
  SELECT id, seq FROM _seed_users WHERE gender = 'female'
),
new_conversations AS (
  INSERT INTO conversations (user1_id, user2_id, created_at)
  SELECT m.id, f.id, now() - (m.seq || ' days')::interval
  FROM males m
  JOIN females f ON f.seq = m.seq
  WHERE m.seq <= 15
  RETURNING id, user1_id, user2_id, created_at
)
INSERT INTO messages (conversation_id, sender_id, message, is_read, sent_at)
SELECT
  nc.id,
  CASE WHEN g.msg_no % 2 = 1 THEN nc.user1_id ELSE nc.user2_id END,
  format('Dummy message %s for conversation %s', g.msg_no, nc.id),
  CASE WHEN g.msg_no < 3 THEN TRUE ELSE FALSE END,
  nc.created_at + (g.msg_no || ' minutes')::interval
FROM new_conversations nc
CROSS JOIN (SELECT generate_series(1, 3) AS msg_no) g;

SELECT
  COUNT(*) FILTER (WHERE gender = 'male') AS inserted_male_users,
  COUNT(*) FILTER (WHERE gender = 'female') AS inserted_female_users,
  COUNT(*) AS inserted_total_users
FROM _seed_users;

COMMIT;
