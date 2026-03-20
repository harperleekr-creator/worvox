-- Add notification system for Live Speaking sessions
-- This migration adds notification tracking and scheduling

-- Notification logs table - tracks all sent notifications
CREATE TABLE IF NOT EXISTS hiing_notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  recipient_type TEXT NOT NULL, -- 'student' or 'teacher'
  recipient_id INTEGER NOT NULL, -- user_id or teacher_id
  notification_type TEXT NOT NULL, -- 'booking_confirmed', 'reminder_1h', 'reminder_10m', 'completed', 'cancelled'
  channel TEXT NOT NULL, -- 'email', 'sms', 'kakao'
  
  -- Contact info
  recipient_email TEXT,
  recipient_phone TEXT,
  
  -- Message content
  template_id TEXT, -- for kakao alimtalk
  subject TEXT, -- for email
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered', 'read'
  sent_at DATETIME,
  delivered_at DATETIME,
  error_message TEXT,
  
  -- Provider response
  provider_message_id TEXT, -- external message ID for tracking
  provider_response TEXT, -- JSON response from provider
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES hiing_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_session ON hiing_notification_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON hiing_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON hiing_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON hiing_notification_logs(sent_at);

-- Add notification tracking columns to sessions
ALTER TABLE hiing_sessions ADD COLUMN booking_notification_sent INTEGER DEFAULT 0;
ALTER TABLE hiing_sessions ADD COLUMN reminder_1h_sent INTEGER DEFAULT 0;
ALTER TABLE hiing_sessions ADD COLUMN reminder_10m_sent INTEGER DEFAULT 0;
ALTER TABLE hiing_sessions ADD COLUMN completion_notification_sent INTEGER DEFAULT 0;

-- Notification preferences table - user preferences
CREATE TABLE IF NOT EXISTS hiing_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Email preferences
  email_enabled INTEGER DEFAULT 1,
  email_booking_confirmed INTEGER DEFAULT 1,
  email_reminder INTEGER DEFAULT 1,
  email_completed INTEGER DEFAULT 1,
  email_cancelled INTEGER DEFAULT 1,
  
  -- SMS/Kakao preferences
  sms_enabled INTEGER DEFAULT 1,
  sms_booking_confirmed INTEGER DEFAULT 1,
  sms_reminder_1h INTEGER DEFAULT 1,
  sms_reminder_10m INTEGER DEFAULT 1,
  sms_cancelled INTEGER DEFAULT 1,
  
  -- Contact info override (if different from user profile)
  notification_email TEXT,
  notification_phone TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON hiing_notification_preferences(user_id);

-- Teacher notification preferences
CREATE TABLE IF NOT EXISTS hiing_teacher_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL UNIQUE,
  
  -- Email preferences
  email_enabled INTEGER DEFAULT 1,
  email_new_booking INTEGER DEFAULT 1,
  email_reminder INTEGER DEFAULT 1,
  email_cancelled INTEGER DEFAULT 1,
  
  -- SMS/Kakao preferences
  sms_enabled INTEGER DEFAULT 1,
  sms_new_booking INTEGER DEFAULT 1,
  sms_reminder_1h INTEGER DEFAULT 1,
  sms_reminder_10m INTEGER DEFAULT 1,
  sms_cancelled INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES hiing_teachers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_notification_prefs ON hiing_teacher_notification_preferences(teacher_id);
