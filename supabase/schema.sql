-- ==========================================
-- 1. CUSTOM TYPES AND USER PROFILES
-- ==========================================

CREATE TYPE user_role AS ENUM ('admin', 'photographer', 'member', 'viewer');
CREATE TYPE event_member_role AS ENUM ('owner', 'admin', 'uploader', 'viewer');

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
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    ai_tags JSONB DEFAULT '[]'::jsonb,
    faces_detected JSONB DEFAULT '[]'::jsonb,

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Admin and members can view private events" ON events;
DROP POLICY IF EXISTS "Event members can view private events" ON events;
DROP POLICY IF EXISTS "Only admins can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Only admins can update events" ON events;
DROP POLICY IF EXISTS "Event owners and admins can update events" ON events;
DROP POLICY IF EXISTS "Only admins can delete events" ON events;
DROP POLICY IF EXISTS "Event owners can delete events" ON events;

CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Event members can view private events" ON events FOR SELECT USING (
    is_public = false AND EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = id AND event_members.user_id = auth.uid())
);
-- Global Admins can still create events (or we can expand this later)
CREATE POLICY "Only admins can insert events" ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Event owners and admins can update events" ON events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = id AND event_members.user_id = auth.uid() AND event_members.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners can delete events" ON events FOR DELETE USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = id AND event_members.user_id = auth.uid() AND event_members.role = 'owner')
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
CREATE POLICY "Authenticated users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 5. REAL-TIME ENABLING
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE event_members;
