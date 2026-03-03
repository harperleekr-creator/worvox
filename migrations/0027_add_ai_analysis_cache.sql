-- AI Analysis Cache Table
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,
  cache_type TEXT NOT NULL, -- 'pronunciation' or 'improved_answer'
  input_hash TEXT NOT NULL,
  analysis_data TEXT NOT NULL, -- JSON string
  user_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  hit_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type_hash ON ai_analysis_cache(cache_type, input_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_last_used ON ai_analysis_cache(last_used_at);

-- Cache stats table
CREATE TABLE IF NOT EXISTS ai_cache_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  api_calls_saved INTEGER DEFAULT 0,
  cost_saved_usd REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_stats_date ON ai_cache_stats(date);
