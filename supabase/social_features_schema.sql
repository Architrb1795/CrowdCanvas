-- ==========================================
-- SOCIAL FEATURES SCHEMA EXTENSION
-- Favourites, Tags, Privacy, Notifications
-- ==========================================

-- 1. Favourites
CREATE TABLE IF NOT EXISTS media_favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_media_favourites_user_id ON media_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_media_favourites_media_id ON media_favourites(media_id);

ALTER TABLE media_favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone with media access can view favourites" ON media_favourites;
CREATE POLICY "Anyone with media access can view favourites" ON media_favourites FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = media_favourites.media_id));

DROP POLICY IF EXISTS "Users can insert their own favourites" ON media_favourites;
CREATE POLICY "Users can insert their own favourites" ON media_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favourites" ON media_favourites;
CREATE POLICY "Users can delete their own favourites" ON media_favourites FOR DELETE USING (auth.uid() = user_id);

-- Check if publication already has table before adding (Realtime may complain if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'media_favourites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE media_favourites;
  END IF;
END $$;


-- 2. Privacy Settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    hide_tagged_photos BOOLEAN DEFAULT false,
    require_tag_approval BOOLEAN DEFAULT true,
    disable_tagging BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto-create privacy settings on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_privacy_settings (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for privacy settings (after the basic profile is created)
DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;
CREATE TRIGGER on_auth_user_created_privacy
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_privacy();

ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all privacy settings to check tagging rules" ON user_privacy_settings;
CREATE POLICY "Users can view all privacy settings to check tagging rules" ON user_privacy_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Photo Tags
DO $$ BEGIN
    CREATE TYPE tag_status AS ENUM ('pending', 'approved', 'rejected', 'removed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS photo_user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    tagged_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tagged_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    x_coordinate FLOAT NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 100),
    y_coordinate FLOAT NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 100),
    status tag_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(media_id, tagged_user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_user_tags_media_id ON photo_user_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_photo_user_tags_tagged_user ON photo_user_tags(tagged_user_id);

ALTER TABLE photo_user_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view approved tags" ON photo_user_tags;
CREATE POLICY "Users can view approved tags" ON photo_user_tags FOR SELECT USING (
    status = 'approved' AND EXISTS (SELECT 1 FROM media WHERE media.id = photo_user_tags.media_id)
);

DROP POLICY IF EXISTS "Users can view their own tags" ON photo_user_tags;
CREATE POLICY "Users can view their own tags" ON photo_user_tags FOR SELECT USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);

DROP POLICY IF EXISTS "Users can insert tags" ON photo_user_tags;
CREATE POLICY "Users can insert tags" ON photo_user_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tagged users and taggers can update tags" ON photo_user_tags;
CREATE POLICY "Tagged users and taggers can update tags" ON photo_user_tags FOR UPDATE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);

DROP POLICY IF EXISTS "Tagged users and taggers can delete tags" ON photo_user_tags;
CREATE POLICY "Tagged users and taggers can delete tags" ON photo_user_tags FOR DELETE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'photo_user_tags'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE photo_user_tags;
  END IF;
END $$;


-- 4. Notifications
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('tag_request', 'tag_approved', 'photo_saved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
