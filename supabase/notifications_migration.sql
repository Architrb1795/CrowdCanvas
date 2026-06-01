-- Create notification category enum
DO $$ BEGIN
    CREATE TYPE notification_category AS ENUM ('social', 'media', 'event', 'ai', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category notification_category NOT NULL,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    action_url TEXT,
    icon TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications 
    FOR DELETE USING (auth.uid() = user_id);

-- System can insert notifications (bypasses RLS or we can add a service role policy)
-- Service role bypasses RLS by default. If we insert from client (not recommended), we'd need an insert policy.
-- Assuming we insert using service_role key in API routes.

-- Trigger for Notification Retention Policy (Max 25 per user)
CREATE OR REPLACE FUNCTION enforce_notification_retention()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM notifications
    WHERE user_id = NEW.user_id
      AND id NOT IN (
          SELECT id 
          FROM notifications 
          WHERE user_id = NEW.user_id 
          ORDER BY created_at DESC 
          LIMIT 25
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_notification_retention ON notifications;
CREATE TRIGGER trg_enforce_notification_retention
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION enforce_notification_retention();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
