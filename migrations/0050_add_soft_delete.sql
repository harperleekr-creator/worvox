-- Add soft delete support to users table
ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN deleted_at DATETIME;

-- Create index for faster queries on active users
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
