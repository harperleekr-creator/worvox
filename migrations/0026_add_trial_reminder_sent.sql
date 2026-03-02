-- Add trial_reminder_sent column to track email notifications
-- Migration: 0026_add_trial_reminder_sent.sql

ALTER TABLE users ADD COLUMN trial_reminder_sent INTEGER DEFAULT 0;

-- Create index for faster queries on trial users
CREATE INDEX IF NOT EXISTS idx_users_trial_expiry 
ON users(is_trial, subscription_end_date, trial_reminder_sent)
WHERE is_trial = 1;

-- Add email_verified column for future use
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;
