-- ==========================================
-- CROWDCANVAS PHASE 4: PERSONALIZED RECOMMENDATIONS
-- ==========================================

-- 1. Create User Preference Profiles Table
CREATE TABLE IF NOT EXISTS user_preference_profiles (
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

-- Index for searching user profiles (though mostly looked up by primary key)
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_engagement ON user_preference_profiles(engagement_score DESC);

-- Enable RLS
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own preference profile" 
    ON user_preference_profiles FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access to preference profiles" 
    ON user_preference_profiles FOR ALL 
    USING (true);


-- 2. Create User Behavior Events Table (for granular tracking)
CREATE TABLE IF NOT EXISTS user_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g. 'image_view', 'search', 'recommendation_click', 'upload'
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    search_query TEXT,
    weight_contribution FLOAT NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick aggregation of a user's recent events
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_user_time ON user_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_type ON user_behavior_events(event_type);

-- Enable RLS
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;

-- Allow users to insert events
CREATE POLICY "Users can insert own behavior events" 
    ON user_behavior_events FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view own events
CREATE POLICY "Users can view own behavior events" 
    ON user_behavior_events FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Service role full access to behavior events" 
    ON user_behavior_events FOR ALL 
    USING (true);


-- 3. Create Personalized Recommendation Metrics Table (for admin dashboard)
CREATE TABLE IF NOT EXISTS personalized_recommendation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_personalized BOOLEAN NOT NULL DEFAULT false,
    clicks INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, is_personalized, report_date)
);

-- Index for daily dashboard queries
CREATE INDEX IF NOT EXISTS idx_personalized_metrics_date ON personalized_recommendation_metrics(report_date);

-- Enable RLS
ALTER TABLE personalized_recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to personalized metrics" 
    ON personalized_recommendation_metrics FOR ALL 
    USING (true);
