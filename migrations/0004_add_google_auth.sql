-- Add Google OAuth fields to users table
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN google_email TEXT;
ALTER TABLE users ADD COLUMN google_picture TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'; -- 'local' or 'google'

-- Create unique index for Google ID (this works as UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
