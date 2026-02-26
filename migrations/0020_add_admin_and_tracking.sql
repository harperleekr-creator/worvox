-- Add admin flag to users table
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Create user_sessions table for tracking login and activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  logout_time DATETIME,
  session_duration INTEGER DEFAULT 0, -- in seconds
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create payment_orders table (if not exists)
CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_key TEXT,
  confirmed_at DATETIME,
  fail_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Set harperleekr@gmail.com as admin (update existing user)
UPDATE users SET is_admin = 1 WHERE email = 'harperleekr@gmail.com';
