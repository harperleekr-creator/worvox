-- Add usage tracking table for daily feature usage
-- This migration adds a table to track daily usage of different features

CREATE TABLE IF NOT EXISTS usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  feature_type TEXT NOT NULL,
  usage_date TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, feature_type, usage_date)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_usage_date ON usage_tracking(usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature_type ON usage_tracking(feature_type);
