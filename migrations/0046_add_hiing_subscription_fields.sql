-- Add Live Speaking subscription fields to users table
ALTER TABLE users ADD COLUMN hiing_lesson_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN hiing_subscription_active INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN hiing_subscription_type TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN hiing_next_billing_date TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN hiing_billing_amount INTEGER DEFAULT 0;
