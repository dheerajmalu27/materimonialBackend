-- Seed data for subscription_plans table
-- Run this after creating the tables

-- Check if subscription_plans table exists
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'subscription_plans';

-- Insert subscription plans (will insert only if table is empty)
INSERT INTO subscription_plans (plan_name, price, duration_days, features) VALUES 
(
  'Premium',
  1200,
  365,
  '{"basicMessaging": true, "videoCall": true, "limitedSearch": false, "advancedSearch": true, "verifiedBadge": true, "unlimitedInterests": true, "dailyInterestsLimit": null, "dailyMessagesLimit": null}'
),
(
  'Diamond',
  2500,
  1095,
  '{"basicMessaging": true, "videoCall": true, "limitedSearch": false, "advancedSearch": true, "verifiedBadge": true, "unlimitedInterests": true, "dailyInterestsLimit": null, "dailyMessagesLimit": null, "prioritySupport": true, "exclusiveFeatures": true}'
);

-- Verify inserted plans
SELECT id, plan_name, price, duration_days, features FROM subscription_plans;
