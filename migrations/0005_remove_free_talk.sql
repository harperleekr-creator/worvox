-- Remove Free Talk topic (ID 5)
DELETE FROM topics WHERE name = 'Free Talk';

-- Note: Topic display order will be handled in the frontend
-- Current topics after deletion:
-- 1. Daily Conversation (beginner) ☀️
-- 2. Business English (intermediate) 💼
-- 3. Travel English (beginner) ✈️
-- 4. Job Interview (advanced) 🎯
