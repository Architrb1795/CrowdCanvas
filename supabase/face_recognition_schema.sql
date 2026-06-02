-- Face Recognition Schema

-- 1. Enable the vector extension (Requires Supabase pgvector support)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Face Profiles (Stores User's 128D Embedding from Selfie)
CREATE TABLE IF NOT EXISTS face_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    embedding vector(128) NOT NULL,
    consent_given BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Media Faces (Stores embeddings for all faces found in uploaded event photos)
CREATE TABLE IF NOT EXISTS media_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    embedding vector(128) NOT NULL,
    bounding_box JSONB, -- { x, y, width, height }
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Face Matches (Links User Profile to Media Face with similarity score)
CREATE TABLE IF NOT EXISTS face_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    face_profile_id UUID NOT NULL REFERENCES face_profiles(id) ON DELETE CASCADE,
    media_face_id UUID NOT NULL REFERENCES media_faces(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE, -- Denormalized for easier querying
    similarity_score FLOAT NOT NULL,
    status TEXT DEFAULT 'pending', -- high, medium, low, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(face_profile_id, media_face_id)
);

-- 5. Recognition Jobs (Tracks async background extraction tasks)
CREATE TABLE IF NOT EXISTS recognition_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    faces_found INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_face_profiles_user_id ON face_profiles(user_id);
CREATE INDEX idx_media_faces_media_id ON media_faces(media_id);
CREATE INDEX idx_face_matches_profile_id ON face_matches(face_profile_id);
CREATE INDEX idx_face_matches_media_id ON face_matches(media_id);
CREATE INDEX idx_recognition_jobs_media_id ON recognition_jobs(media_id);

-- RLS Policies

ALTER TABLE face_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_jobs ENABLE ROW LEVEL SECURITY;

-- Face Profiles: Users can view and manage only their own
CREATE POLICY "Users can view own face profile" ON face_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own face profile" ON face_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own face profile" ON face_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own face profile" ON face_profiles FOR DELETE USING (auth.uid() = user_id);

-- Media Faces: Read-only for authenticated users (server populates this)
CREATE POLICY "Anyone can view media faces" ON media_faces FOR SELECT USING (true);
-- (Insert/Update/Delete managed by server actions via service role or authorized paths)

-- Face Matches: Users can see matches for their own profile
CREATE POLICY "Users can view own matches" ON face_matches FOR SELECT USING (
    EXISTS (SELECT 1 FROM face_profiles fp WHERE fp.id = face_profile_id AND fp.user_id = auth.uid())
);
CREATE POLICY "Users can delete own matches" ON face_matches FOR DELETE USING (
    EXISTS (SELECT 1 FROM face_profiles fp WHERE fp.id = face_profile_id AND fp.user_id = auth.uid())
);

-- Recognition Jobs: Viewable by anyone, managed by server
CREATE POLICY "Anyone can view recognition jobs" ON recognition_jobs FOR SELECT USING (true);

-- Create a function to match faces (Cosine similarity)
CREATE OR REPLACE FUNCTION match_faces(
  query_embedding vector(128),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  media_face_id uuid,
  media_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id AS media_face_id,
    mf.media_id,
    1 - (mf.embedding <=> query_embedding) AS similarity
  FROM media_faces mf
  WHERE 1 - (mf.embedding <=> query_embedding) > match_threshold
  ORDER BY mf.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to match a media face against all user profiles
CREATE OR REPLACE FUNCTION match_media_to_profiles(
  query_embedding vector(128),
  match_threshold float
)
RETURNS TABLE (
  profile_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id AS profile_id,
    1 - (fp.embedding <=> query_embedding) AS similarity
  FROM face_profiles fp
  WHERE 1 - (fp.embedding <=> query_embedding) > match_threshold
  ORDER BY fp.embedding <=> query_embedding;
END;
$$;
