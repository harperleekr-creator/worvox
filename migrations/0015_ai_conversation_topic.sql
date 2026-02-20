-- Update Daily Conversation topic to AI 영어회화
UPDATE topics
SET 
  name = 'AI 영어회화',
  description = 'Real-time conversation practice with AI tutor for natural English learning',
  icon = '💬'
WHERE name = 'Daily Conversation';
