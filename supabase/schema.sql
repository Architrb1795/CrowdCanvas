-- ==========================================
-- 1. CUSTOM TYPES AND USER PROFILES
-- ==========================================

CREATE TYPE user_role AS ENUM ('admin', 'photographer', 'member', 'viewer');
CREATE TYPE event_member_role AS ENUM ('owner', 'admin', 'uploader', 'viewer');

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if migrating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. CORE ENTITIES SCHEMA
-- ==========================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    location TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- AI Event Intelligence
    ai_summary TEXT,
    ai_highlights JSONB,
    event_story JSONB,
    event_tags TEXT[],
    
    -- Watermarking Settings
    watermark_enabled BOOLEAN DEFAULT false,
    watermark_text TEXT,
    watermark_style TEXT DEFAULT 'bottom_right' CHECK (watermark_style IN ('bottom_right', 'diagonal', 'badge', 'logo')),
    watermark_opacity INTEGER DEFAULT 50,
    watermark_size INTEGER DEFAULT 30,
    watermark_logo_url TEXT
);

CREATE TABLE event_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role event_member_role DEFAULT 'viewer' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_members_event_id ON event_members(event_id);
CREATE INDEX idx_event_members_user_id ON event_members(user_id);

CREATE TABLE event_role_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role event_member_role DEFAULT 'uploader',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id, requested_role)
);
CREATE INDEX idx_event_role_requests_event_id ON event_role_requests(event_id);

CREATE OR REPLACE FUNCTION public.handle_new_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.event_members (event_id, user_id, role)
  VALUES (new.id, new.created_by, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign owner role when event is created
DROP TRIGGER IF EXISTS on_event_created ON events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_event();


CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('photo', 'video')),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tags TEXT[],
    is_private BOOLEAN DEFAULT false,
    
    -- Cloudinary & Metadata Expansion
    thumbnail_url TEXT,
    cloudinary_public_id TEXT,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration NUMERIC,
    mime_type TEXT,
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_status TEXT DEFAULT 'idle',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Future AI Integration Hooks
    ai_tags TEXT[],
    faces_detected JSONB DEFAULT '[]'::jsonb,
    ai_caption TEXT,
    ai_summary TEXT,
    ai_objects TEXT[],
    ocr_text TEXT,
    scene_type TEXT,
    mood TEXT,
    people_count INTEGER,
    dominant_colors TEXT[],
    similarity_group TEXT,
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    embedding VECTOR(768),
    processing_error TEXT,
    processing_version TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_media_event_id ON media(event_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);

-- ==========================================
-- 3. SOCIAL INTERACTION SCHEMA
-- ==========================================

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TYPE share_type_enum AS ENUM ('copy_link', 'whatsapp', 'twitter', 'facebook', 'download');

CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    share_type share_type_enum NOT NULL,
    is_watermarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_comments_media_id ON comments(media_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_media_id ON likes(media_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_shares_media_id ON shares(media_id);
CREATE INDEX idx_shares_user_id ON shares(user_id);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Admin and members can view private events" ON events;
DROP POLICY IF EXISTS "Event members can view private events" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Only admins can update events" ON events;
DROP POLICY IF EXISTS "Event owners and admins can update events" ON events;
DROP POLICY IF EXISTS "Only admins can delete events" ON events;
DROP POLICY IF EXISTS "Event owners can delete events" ON events;

CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Event members can view private events" ON events FOR SELECT USING (
    is_public = false AND EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid())
);
-- All authenticated users can create events
CREATE POLICY "Authenticated users can insert events" ON events FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);
CREATE POLICY "Event owners and admins can update events" ON events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid() AND event_members.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners can delete events" ON events FOR DELETE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid() AND event_members.role = 'owner')
);

-- Event Members
CREATE POLICY "Public event members are viewable by everyone" ON event_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_members.event_id AND events.is_public = true)
);
CREATE POLICY "Private event members viewable by members" ON event_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_members.event_id AND em.user_id = auth.uid())
);
CREATE POLICY "Event owners and admins can insert members" ON event_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners and admins can update members" ON event_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners and admins can delete members" ON event_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);

-- Event Role Requests
CREATE POLICY "Users can insert their own requests" ON event_role_requests FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
CREATE POLICY "Users can view their own requests" ON event_role_requests FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Event owners and admins can view requests" ON event_role_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_role_requests.event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners and admins can update requests" ON event_role_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_role_requests.event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);

-- Media
DROP POLICY IF EXISTS "Public media is viewable by everyone" ON media;
DROP POLICY IF EXISTS "Admin, photographers, and members can view private media" ON media;
DROP POLICY IF EXISTS "Event members can view private media" ON media;
DROP POLICY IF EXISTS "Admins and photographers can upload media" ON media;
DROP POLICY IF EXISTS "Event owners, admins, and uploaders can upload media" ON media;

CREATE POLICY "Public media is viewable by everyone" ON media FOR SELECT USING (
    is_private = false AND EXISTS (SELECT 1 FROM events WHERE events.id = media.event_id AND events.is_public = true)
);
CREATE POLICY "Event members can view private media" ON media FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = media.event_id AND event_members.user_id = auth.uid())
);
CREATE POLICY "Event owners, admins, and uploaders can upload media" ON media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = event_id AND event_members.user_id = auth.uid() AND event_members.role IN ('owner', 'admin', 'uploader'))
);

-- Likes and Comments (Unchanged, but good practice to explicitly state)
DROP POLICY IF EXISTS "Anyone with media access can view likes" ON likes;
DROP POLICY IF EXISTS "Anyone with media access can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Anyone with media access can view likes" ON likes FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = likes.media_id));
CREATE POLICY "Anyone with media access can view comments" ON comments FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = comments.media_id));
CREATE POLICY "Anyone with media access can view shares" ON shares FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = shares.media_id));

CREATE POLICY "Authenticated users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own shares" ON shares FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. REAL-TIME ENABLING
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;
ALTER PUBLICATION supabase_realtime ADD TABLE event_members;
ALTER PUBLICATION supabase_realtime ADD TABLE event_role_requests;

-- ==========================================
-- 6. AI & VECTOR SEARCH RPC
-- ==========================================

CREATE OR REPLACE FUNCTION match_media (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_event_id uuid DEFAULT NULL,
  filter_mood text DEFAULT NULL,
  filter_scene text DEFAULT NULL,
  filter_people_count int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  file_url text,
  thumbnail_url text,
  media_type text,
  ai_caption text,
  ai_tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    media.id,
    media.event_id,
    media.file_url,
    media.thumbnail_url,
    media.media_type,
    media.ai_caption,
    media.ai_tags,
    1 - (media.embedding <=> query_embedding) AS similarity
  FROM media
  WHERE media.embedding IS NOT NULL
    AND 1 - (media.embedding <=> query_embedding) > match_threshold
    AND (filter_event_id IS NULL OR media.event_id = filter_event_id)
    AND (filter_mood IS NULL OR media.mood = filter_mood)
    AND (filter_scene IS NULL OR media.scene_type = filter_scene)
    AND (filter_people_count IS NULL OR media.people_count = filter_people_count)
  ORDER BY media.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_media_embedding ON media USING hnsw (embedding vector_cosine_ops);
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
CREATE POLICY "Anyone with media access can view favourites" ON media_favourites FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = media_favourites.media_id));
CREATE POLICY "Users can insert their own favourites" ON media_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites" ON media_favourites FOR DELETE USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE media_favourites;


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
CREATE POLICY "Users can view all privacy settings to check tagging rules" ON user_privacy_settings FOR SELECT USING (true);
CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. Photo Tags
CREATE TYPE tag_status AS ENUM ('pending', 'approved', 'rejected', 'removed');

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
-- People can see approved tags if they can see the media. Also users can see their own pending tags.
CREATE POLICY "Users can view approved tags" ON photo_user_tags FOR SELECT USING (
    status = 'approved' AND EXISTS (SELECT 1 FROM media WHERE media.id = photo_user_tags.media_id)
);
CREATE POLICY "Users can view their own tags" ON photo_user_tags FOR SELECT USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);
CREATE POLICY "Users can insert tags" ON photo_user_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tagged users and taggers can update tags" ON photo_user_tags FOR UPDATE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);
CREATE POLICY "Tagged users and taggers can delete tags" ON photo_user_tags FOR DELETE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE photo_user_tags;


-- 4. Notifications
CREATE TYPE notification_type AS ENUM ('tag_request', 'tag_approved', 'photo_saved');

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
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- Insertions are done via backend RPC or server-side actions, but if client triggers:
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
