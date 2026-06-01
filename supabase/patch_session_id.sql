-- Patch for Recommendation Analytics
-- Change session_id to TEXT to support non-UUID browser fallbacks

ALTER TABLE recommendation_analytics ALTER COLUMN session_id TYPE TEXT;
