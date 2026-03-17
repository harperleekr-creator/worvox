-- Add total_words_practiced column to users table for tracking words across all modes
-- Migration: 0041_add_words_tracking.sql
-- Date: 2026-03-17

-- Add column if it doesn't exist
ALTER TABLE users ADD COLUMN total_words_practiced INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_words_practiced ON users(total_words_practiced);

-- Update existing users with estimated words based on current messages
-- Approximate: (totalMessages / 2) * 10 words per message
UPDATE users 
SET total_words_practiced = (
  SELECT COALESCE(COUNT(*) * 5, 0)
  FROM messages 
  WHERE session_id IN (
    SELECT id FROM sessions WHERE user_id = users.id
  )
)
WHERE total_words_practiced = 0;
