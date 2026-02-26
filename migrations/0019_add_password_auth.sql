-- Add password authentication support
-- This migration adds password_hash column for email/password login

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
