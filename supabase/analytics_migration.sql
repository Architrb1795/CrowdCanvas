-- ==========================================
-- CROWDCANVAS PHASE 3: RECOMMENDATION ANALYTICS
-- ==========================================

-- 1. Modify existing recommendation_analytics table
ALTER TABLE recommendation_analytics
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS view_duration_ms INTEGER;

-- Ensure event_type is flexible. Current values: 'generated', 'viewed', 'clicked', 'ignored'

-- 2. Create recommendation_weights_config table
CREATE TABLE IF NOT EXISTS recommendation_weights_config (
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

-- Insert a default row if none exists
INSERT INTO recommendation_weights_config (tag_weight, desc_weight, ocr_weight, mood_weight, scene_weight, event_weight, embedding_weight)
SELECT 0.35, 0.20, 0.10, 0.10, 0.10, 0.10, 0.05
WHERE NOT EXISTS (SELECT 1 FROM recommendation_weights_config);

-- Enable RLS
ALTER TABLE recommendation_weights_config ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (since the edge needs it)
CREATE POLICY "Enable read access for all" ON recommendation_weights_config FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON recommendation_weights_config FOR ALL USING (true);


-- 3. Create a daily aggregate table for fast dashboard queries
CREATE TABLE IF NOT EXISTS recommendation_daily_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    category TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    ctr FLOAT NOT NULL DEFAULT 0.0,
    UNIQUE(report_date, category)
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_recommendation_daily_aggregates_date ON recommendation_daily_aggregates(report_date);

-- Enable RLS
ALTER TABLE recommendation_daily_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all" ON recommendation_daily_aggregates FOR SELECT USING (true);
CREATE POLICY "Enable all access for service role" ON recommendation_daily_aggregates FOR ALL USING (true);
