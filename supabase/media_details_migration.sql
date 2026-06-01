-- Migration for tracking stats and advanced AI fields

ALTER TABLE media ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE media ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE media ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0;
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_style TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS ai_confidence INTEGER;

-- Optionally you might want an endpoint to easily increment these, but doing it from API is sufficient.
