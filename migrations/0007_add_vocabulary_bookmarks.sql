-- Add vocabulary bookmarks table
CREATE TABLE IF NOT EXISTS vocabulary_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES vocabulary_words(id),
  UNIQUE(user_id, word_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vocabulary_bookmarks_user_id ON vocabulary_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_bookmarks_word_id ON vocabulary_bookmarks(word_id);
