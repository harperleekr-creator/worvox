-- Add custom wordbooks tables
CREATE TABLE IF NOT EXISTS custom_wordbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS wordbook_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wordbook_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES custom_wordbooks(id),
  FOREIGN KEY (word_id) REFERENCES vocabulary_words(id),
  UNIQUE(wordbook_id, word_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_wordbooks_user_id ON custom_wordbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_wordbook_words_wordbook_id ON wordbook_words(wordbook_id);
CREATE INDEX IF NOT EXISTS idx_wordbook_words_word_id ON wordbook_words(word_id);
