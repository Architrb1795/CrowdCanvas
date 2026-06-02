-- ==========================================
-- AUTHENTICATION & SECURITY UPGRADE SCHEMA
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. User Sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON user_sessions FOR DELETE USING (auth.uid() = user_id);

-- 2. Soft Delete functionality
-- Add deleted_at to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Security Notifications
-- Expand the notification_type enum to support security notifications
-- Note: Postgres doesn't allow ALTER TYPE ADD VALUE IF NOT EXISTS easily without a block, so we do it safely:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_type' AND e.enumlabel = 'security_alert') THEN
    ALTER TYPE notification_type ADD VALUE 'security_alert';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'notification_type' AND e.enumlabel = 'new_login') THEN
    ALTER TYPE notification_type ADD VALUE 'new_login';
  END IF;
END $$;
