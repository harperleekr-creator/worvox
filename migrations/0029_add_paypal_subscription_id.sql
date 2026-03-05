-- Add PayPal subscription ID column to users table
ALTER TABLE users ADD COLUMN paypal_subscription_id TEXT;
