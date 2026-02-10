-- Add topic_id column to sessions table
ALTER TABLE sessions ADD COLUMN topic_id INTEGER;

-- Create foreign key index (SQLite doesn't enforce FK on ALTER, but we can create index)
CREATE INDEX IF NOT EXISTS idx_sessions_topic_id ON sessions(topic_id);

-- Update existing records: try to match topic text to topic_id
UPDATE sessions 
SET topic_id = (
  SELECT id FROM topics 
  WHERE LOWER(topics.name) LIKE '%' || LOWER(sessions.topic) || '%'
  LIMIT 1
)
WHERE topic_id IS NULL;

-- For any remaining NULL topic_ids, set to Free Talk (id=5) as default
UPDATE sessions 
SET topic_id = 5
WHERE topic_id IS NULL;
