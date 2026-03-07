-- Add spin_count column to users table
ALTER TABLE users ADD COLUMN spin_count INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_spin_count ON users(spin_count);
