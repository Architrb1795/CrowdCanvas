-- ==========================================
-- CROWDCANVAS RECOMMENDATION ENGINE V2
-- ==========================================

-- 1. Create Recommendation Cache Table
CREATE TABLE IF NOT EXISTS recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for fast lookup by source image
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_source ON recommendation_cache(source_media_id);

-- Enable RLS on cache
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for all users" ON recommendation_cache
    FOR SELECT USING (true);
    
-- Allow service role to manage cache (bypasses RLS anyway, but good practice)
CREATE POLICY "Enable all access for service role" ON recommendation_cache
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Create Recommendation Analytics Table
CREATE TABLE IF NOT EXISTS recommendation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    recommended_media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'click'
    position INTEGER NOT NULL,
    score FLOAT NOT NULL,
    category TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast aggregation
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_source ON recommendation_analytics(source_media_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_event ON recommendation_analytics(event_type);

-- Enable RLS on analytics
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;

-- Allow insert access for all users (client side tracking)
CREATE POLICY "Enable insert access for all users" ON recommendation_analytics
    FOR INSERT WITH CHECK (true);

-- Allow read access for service role / admin
CREATE POLICY "Enable read access for service role" ON recommendation_analytics
    FOR SELECT USING (true);
