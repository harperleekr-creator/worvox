-- Remove unnecessary topics, keep only Vocabulary and Daily Conversation
DELETE FROM topics WHERE name IN ('Travel English', 'Job Interview', 'Business English');

-- Update Daily Conversation name to AI English Conversation
UPDATE topics SET name = 'AI English Conversation' WHERE name = 'Daily Conversation';
