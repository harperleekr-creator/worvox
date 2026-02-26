-- Add billing and trial columns to users table

-- Billing key from Toss Payments
ALTER TABLE users ADD COLUMN billing_key TEXT;

-- Trial period tracking
ALTER TABLE users ADD COLUMN trial_start_date DATETIME;
ALTER TABLE users ADD COLUMN trial_end_date DATETIME;
ALTER TABLE users ADD COLUMN is_trial INTEGER DEFAULT 0;

-- Auto billing settings
ALTER TABLE users ADD COLUMN auto_billing_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_billing_attempt DATETIME;
ALTER TABLE users ADD COLUMN billing_failure_count INTEGER DEFAULT 0;

-- Customer key for Toss Payments (unique identifier)
ALTER TABLE users ADD COLUMN toss_customer_key TEXT;

-- Create index for trial end date (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_users_trial_end_date ON users(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_users_auto_billing ON users(auto_billing_enabled);
