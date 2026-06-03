-- ==========================================
-- CROWDCANVAS UNIFIED SCHEMA
-- ==========================================
-- This file contains the complete, consolidated database schema,
-- merging all core tables, AI intelligence, personalization, 
-- and social features into a single initialization script.
-- ==========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- 1. CUSTOM TYPES & ENUMS
-- ==========================================

CREATE TYPE user_role AS ENUM ('admin', 'photographer', 'member', 'viewer');
CREATE TYPE event_member_role AS ENUM ('owner', 'admin', 'uploader', 'viewer');
CREATE TYPE share_type_enum AS ENUM ('copy_link', 'whatsapp', 'twitter', 'facebook', 'download');
CREATE TYPE tag_status AS ENUM ('pending', 'approved', 'rejected', 'removed');
CREATE TYPE notification_type AS ENUM ('tag_request', 'tag_approved', 'photo_saved', 'security_alert', 'new_login');
CREATE TYPE notification_category AS ENUM ('social', 'media', 'event', 'ai', 'system');

-- ==========================================
-- 2. CORE ENTITIES SCHEMA
-- ==========================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);


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
    
    -- Cloudinary & Metadata
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
    
    -- Engagement Stats
    title TEXT,
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    
    -- AI Integration Hooks
    ai_style TEXT,
    ai_confidence INTEGER,
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
CREATE INDEX idx_media_embedding ON media USING hnsw (embedding vector_cosine_ops);


-- ==========================================
-- 3. SOCIAL & NOTIFICATION SCHEMA
-- ==========================================

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);
CREATE INDEX idx_likes_media_id ON likes(media_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_comments_media_id ON comments(media_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_modtime ON comments;
CREATE TRIGGER update_comments_modtime BEFORE UPDATE ON comments FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    share_type share_type_enum NOT NULL,
    is_watermarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_shares_media_id ON shares(media_id);
CREATE INDEX idx_shares_user_id ON shares(user_id);

CREATE TABLE media_favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, media_id)
);
CREATE INDEX idx_media_favourites_user_id ON media_favourites(user_id);
CREATE INDEX idx_media_favourites_media_id ON media_favourites(media_id);

CREATE TABLE user_pinned_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, event_id)
);
CREATE INDEX idx_user_pinned_events_user_id ON user_pinned_events(user_id);
CREATE INDEX idx_user_pinned_events_event_id ON user_pinned_events(event_id);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type notification_type,
    category notification_category DEFAULT 'system',
    action_type TEXT,
    title TEXT,
    description TEXT,
    action_url TEXT,
    icon TEXT,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE OR REPLACE FUNCTION enforce_notification_retention()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM notifications
    WHERE user_id = NEW.user_id
      AND id NOT IN (
          SELECT id FROM notifications 
          WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 25
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_notification_retention ON notifications;
CREATE TRIGGER trg_enforce_notification_retention AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION enforce_notification_retention();


-- ==========================================
-- 4. FACE RECOGNITION & TAGGING
-- ==========================================

CREATE TABLE face_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    embedding vector(128) NOT NULL,
    consent_given BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_face_profiles_user_id ON face_profiles(user_id);

CREATE TABLE media_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    embedding vector(128) NOT NULL,
    bounding_box JSONB, 
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX idx_media_faces_media_id ON media_faces(media_id);

CREATE TABLE face_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    face_profile_id UUID NOT NULL REFERENCES face_profiles(id) ON DELETE CASCADE,
    media_face_id UUID NOT NULL REFERENCES media_faces(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(face_profile_id, media_face_id)
);
CREATE INDEX idx_face_matches_profile_id ON face_matches(face_profile_id);
CREATE INDEX idx_face_matches_media_id ON face_matches(media_id);

CREATE TABLE recognition_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    faces_found INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_recognition_jobs_media_id ON recognition_jobs(media_id);

CREATE TABLE user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    hide_tagged_photos BOOLEAN DEFAULT false,
    require_tag_approval BOOLEAN DEFAULT true,
    disable_tagging BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_privacy_settings (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;
CREATE TRIGGER on_auth_user_created_privacy AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_privacy();

CREATE TABLE photo_user_tags (
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
CREATE INDEX idx_photo_user_tags_media_id ON photo_user_tags(media_id);
CREATE INDEX idx_photo_user_tags_tagged_user ON photo_user_tags(tagged_user_id);


-- ==========================================
-- 5. PERSONALIZATION & RECOMMENDATIONS
-- ==========================================

CREATE TABLE user_preference_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    favorite_tags JSONB NOT NULL DEFAULT '{}'::jsonb,
    favorite_moods JSONB NOT NULL DEFAULT '{}'::jsonb,
    favorite_scenes JSONB NOT NULL DEFAULT '{}'::jsonb,
    favorite_events JSONB NOT NULL DEFAULT '{}'::jsonb,
    interest_embedding VECTOR(768),
    engagement_score FLOAT NOT NULL DEFAULT 0.0,
    ai_profile_summary TEXT,
    ai_summary_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_preference_profiles_engagement ON user_preference_profiles(engagement_score DESC);

CREATE TABLE user_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    search_query TEXT,
    weight_contribution FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_behavior_events_user_time ON user_behavior_events(user_id, created_at DESC);
CREATE INDEX idx_user_behavior_events_type ON user_behavior_events(event_type);

CREATE TABLE personalized_recommendation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_personalized BOOLEAN NOT NULL DEFAULT false,
    clicks INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, is_personalized, report_date)
);
CREATE INDEX idx_personalized_metrics_date ON personalized_recommendation_metrics(report_date);

CREATE TABLE recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_recommendation_cache_source ON recommendation_cache(source_media_id);

CREATE TABLE recommendation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    recommended_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    position INTEGER NOT NULL,
    score FLOAT NOT NULL,
    category TEXT NOT NULL,
    reason TEXT NOT NULL,
    session_id TEXT,
    user_id UUID,
    view_duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recommendation_analytics_source ON recommendation_analytics(source_media_id);
CREATE INDEX idx_recommendation_analytics_event ON recommendation_analytics(event_type);

CREATE TABLE recommendation_weights_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_weight FLOAT NOT NULL DEFAULT 0.35,
    desc_weight FLOAT NOT NULL DEFAULT 0.20,
    ocr_weight FLOAT NOT NULL DEFAULT 0.10,
    mood_weight FLOAT NOT NULL DEFAULT 0.10,
    scene_weight FLOAT NOT NULL DEFAULT 0.10,
    event_weight FLOAT NOT NULL DEFAULT 0.10,
    embedding_weight FLOAT NOT NULL DEFAULT 0.05,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO recommendation_weights_config (tag_weight, desc_weight, ocr_weight, mood_weight, scene_weight, event_weight, embedding_weight)
SELECT 0.35, 0.20, 0.10, 0.10, 0.10, 0.10, 0.05 WHERE NOT EXISTS (SELECT 1 FROM recommendation_weights_config);

CREATE TABLE recommendation_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    category TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    ctr FLOAT NOT NULL DEFAULT 0.0,
    UNIQUE(report_date, category)
);
CREATE INDEX idx_recommendation_daily_aggregates_date ON recommendation_daily_aggregates(report_date);


-- ==========================================
-- 6. RPC FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION match_media (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_event_id uuid DEFAULT NULL,
  filter_mood text DEFAULT NULL,
  filter_scene text DEFAULT NULL,
  filter_people_count int DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  event_id uuid,
  file_url text,
  thumbnail_url text,
  media_type text,
  ai_caption text,
  ai_tags text[],
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT
    media.id, media.event_id, media.file_url, media.thumbnail_url, media.media_type, media.ai_caption, media.ai_tags,
    1 - (media.embedding <=> query_embedding) AS similarity
  FROM media
  WHERE media.embedding IS NOT NULL
    AND 1 - (media.embedding <=> query_embedding) > match_threshold
    AND (filter_event_id IS NULL OR media.event_id = filter_event_id)
    AND (filter_mood IS NULL OR media.mood = filter_mood)
    AND (filter_scene IS NULL OR media.scene_type = filter_scene)
    AND (filter_people_count IS NULL OR media.people_count = filter_people_count)
  ORDER BY media.embedding <=> query_embedding LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_faces(
  query_embedding vector(128),
  match_threshold float,
  match_count int
) RETURNS TABLE (
  media_face_id uuid,
  media_id uuid,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT
    mf.id AS media_face_id, mf.media_id,
    1 - (mf.embedding <=> query_embedding) AS similarity
  FROM media_faces mf
  WHERE 1 - (mf.embedding <=> query_embedding) > match_threshold
  ORDER BY mf.embedding <=> query_embedding LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_media_to_profiles(
  query_embedding vector(128),
  match_threshold float
) RETURNS TABLE (
  profile_id uuid,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT
    fp.id AS profile_id,
    1 - (fp.embedding <=> query_embedding) AS similarity
  FROM face_profiles fp
  WHERE 1 - (fp.embedding <=> query_embedding) > match_threshold
  ORDER BY fp.embedding <=> query_embedding;
END;
$$;


-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pinned_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_recommendation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_weights_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_daily_aggregates ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User Sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON user_sessions FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (is_public = true);
CREATE POLICY "Event members can view private events" ON events FOR SELECT USING (
    is_public = false AND EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = events.id AND event_members.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can insert events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
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
CREATE POLICY "Users can insert their own requests" ON event_role_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own requests" ON event_role_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Event owners and admins can view requests" ON event_role_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_role_requests.event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);
CREATE POLICY "Event owners and admins can update requests" ON event_role_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM event_members em WHERE em.event_id = event_role_requests.event_id AND em.user_id = auth.uid() AND em.role IN ('owner', 'admin'))
);

-- Media
CREATE POLICY "Public media is viewable by everyone" ON media FOR SELECT USING (
    is_private = false AND EXISTS (SELECT 1 FROM events WHERE events.id = media.event_id AND events.is_public = true)
);
CREATE POLICY "Event members can view private media" ON media FOR SELECT USING (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = media.event_id AND event_members.user_id = auth.uid())
);
CREATE POLICY "Event owners, admins, and uploaders can upload media" ON media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM event_members WHERE event_members.event_id = event_id AND event_members.user_id = auth.uid() AND event_members.role IN ('owner', 'admin', 'uploader'))
);

-- Social (Likes, Comments, Shares, Favourites)
CREATE POLICY "Anyone with media access can view likes" ON likes FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = likes.media_id));
CREATE POLICY "Anyone with media access can view comments" ON comments FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = comments.media_id));
CREATE POLICY "Anyone with media access can view shares" ON shares FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = shares.media_id));
CREATE POLICY "Anyone with media access can view favourites" ON media_favourites FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = media_favourites.media_id));

CREATE POLICY "Authenticated users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own shares" ON shares FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can insert their own favourites" ON media_favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own pinned events" ON user_pinned_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pinned events" ON user_pinned_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favourites" ON media_favourites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pinned events" ON user_pinned_events FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Face Recognition
CREATE POLICY "Users can view own face profile" ON face_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own face profile" ON face_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own face profile" ON face_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own face profile" ON face_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view media faces" ON media_faces FOR SELECT USING (true);
CREATE POLICY "Users can view own matches" ON face_matches FOR SELECT USING (EXISTS (SELECT 1 FROM face_profiles fp WHERE fp.id = face_profile_id AND fp.user_id = auth.uid()));
CREATE POLICY "Users can delete own matches" ON face_matches FOR DELETE USING (EXISTS (SELECT 1 FROM face_profiles fp WHERE fp.id = face_profile_id AND fp.user_id = auth.uid()));
CREATE POLICY "Anyone can view recognition jobs" ON recognition_jobs FOR SELECT USING (true);

-- Privacy Settings & Tags
CREATE POLICY "Users can view all privacy settings to check tagging rules" ON user_privacy_settings FOR SELECT USING (true);
CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved tags" ON photo_user_tags FOR SELECT USING (status = 'approved' AND EXISTS (SELECT 1 FROM media WHERE media.id = photo_user_tags.media_id));
CREATE POLICY "Users can view their own tags" ON photo_user_tags FOR SELECT USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);
CREATE POLICY "Users can insert tags" ON photo_user_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tagged users and taggers can update tags" ON photo_user_tags FOR UPDATE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);
CREATE POLICY "Tagged users and taggers can delete tags" ON photo_user_tags FOR DELETE USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);

-- Personalization & Recommendation Engine
CREATE POLICY "Users can read own preference profile" ON user_preference_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to preference profiles" ON user_preference_profiles FOR ALL USING (true);

CREATE POLICY "Users can insert own behavior events" ON user_behavior_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own behavior events" ON user_behavior_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to behavior events" ON user_behavior_events FOR ALL USING (true);

CREATE POLICY "Service role full access to personalized metrics" ON personalized_recommendation_metrics FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON recommendation_cache FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role cache" ON recommendation_cache FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert access for all users" ON recommendation_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for service role" ON recommendation_analytics FOR SELECT USING (true);

CREATE POLICY "Enable read access for all" ON recommendation_weights_config FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role weights" ON recommendation_weights_config FOR ALL USING (true);

CREATE POLICY "Enable read access for all daily" ON recommendation_daily_aggregates FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role daily" ON recommendation_daily_aggregates FOR ALL USING (true);

-- ==========================================
-- 8. REAL-TIME PUBLICATION
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;
ALTER PUBLICATION supabase_realtime ADD TABLE event_members;
ALTER PUBLICATION supabase_realtime ADD TABLE event_role_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE media_favourites;
ALTER PUBLICATION supabase_realtime ADD TABLE user_pinned_events;
ALTER PUBLICATION supabase_realtime ADD TABLE photo_user_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ==========================================
-- END OF UNIFIED SCHEMA
-- ==========================================
