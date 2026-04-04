-- Phase 1: Authentication & Employee Tracking
-- Migration 002: Create Login Logs Table

CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  region VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  country VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  user_agent TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  session_duration INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at);

-- Add constraint for session duration (must be positive if set)
ALTER TABLE login_logs ADD CONSTRAINT check_session_duration CHECK (session_duration IS NULL OR session_duration >= 0);
