-- ==========================================
-- CROWDCANVAS AI INTELLIGENCE EXPANSION
-- ==========================================
-- This migration script is completely idempotent. 
-- It handles error checking, column additions, and type changes safely.

-- 1. Enable the pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Expand the Media Table Safely
DO $$ 
BEGIN
    -- ai_caption
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_caption') THEN
        ALTER TABLE media ADD COLUMN ai_caption TEXT;
    END IF;

    -- ai_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_summary') THEN
        ALTER TABLE media ADD COLUMN ai_summary TEXT;
    END IF;

    -- ai_tags
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_tags' AND data_type='jsonb') THEN
        ALTER TABLE media DROP COLUMN ai_tags;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_tags') THEN
        ALTER TABLE media ADD COLUMN ai_tags TEXT[];
    END IF;

    -- ai_objects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_objects') THEN
        ALTER TABLE media ADD COLUMN ai_objects TEXT[];
    END IF;

    -- ocr_text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ocr_text') THEN
        ALTER TABLE media ADD COLUMN ocr_text TEXT;
    END IF;

    -- scene_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='scene_type') THEN
        ALTER TABLE media ADD COLUMN scene_type TEXT;
    END IF;

    -- mood
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='mood') THEN
        ALTER TABLE media ADD COLUMN mood TEXT;
    END IF;

    -- people_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='people_count') THEN
        ALTER TABLE media ADD COLUMN people_count INTEGER;
    END IF;

    -- dominant_colors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='dominant_colors') THEN
        ALTER TABLE media ADD COLUMN dominant_colors TEXT[];
    END IF;

    -- similarity_group
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='similarity_group') THEN
        ALTER TABLE media ADD COLUMN similarity_group TEXT;
    END IF;

    -- ai_processed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_processed') THEN
        ALTER TABLE media ADD COLUMN ai_processed BOOLEAN DEFAULT false;
    END IF;

    -- ai_processed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='ai_processed_at') THEN
        ALTER TABLE media ADD COLUMN ai_processed_at TIMESTAMPTZ;
    END IF;

    -- embedding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='embedding') THEN
        ALTER TABLE media ADD COLUMN embedding VECTOR(768);
    END IF;

    -- processing_error
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='processing_error') THEN
        ALTER TABLE media ADD COLUMN processing_error TEXT;
    END IF;

    -- processing_version
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='media' AND column_name='processing_version') THEN
        ALTER TABLE media ADD COLUMN processing_version TEXT;
    END IF;

END $$;

-- 3. Expand the Events Table Safely
DO $$ 
BEGIN
    -- ai_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='ai_summary') THEN
        ALTER TABLE events ADD COLUMN ai_summary TEXT;
    END IF;

    -- ai_highlights
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='ai_highlights') THEN
        ALTER TABLE events ADD COLUMN ai_highlights JSONB;
    END IF;

    -- event_story
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='event_story') THEN
        ALTER TABLE events ADD COLUMN event_story JSONB;
    END IF;

    -- event_tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='event_tags') THEN
        ALTER TABLE events ADD COLUMN event_tags TEXT[];
    END IF;
END $$;

-- 4. Create Match Media RPC function for Semantic Vector Search
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

-- 5. Create vector index for optimized similarity search (HNSW is faster than IVFFlat)
CREATE INDEX IF NOT EXISTS idx_media_embedding ON media USING hnsw (embedding vector_cosine_ops);
