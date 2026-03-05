-- Create payment_orders table for tracking all payments (Toss, PayPal, etc.)
CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'toss', -- 'toss' or 'paypal'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  payment_key TEXT, -- Toss paymentKey or PayPal order ID
  fail_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_method ON payment_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
