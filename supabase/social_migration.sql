-- Add updated_at to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add updated_at trigger for comments
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_modtime ON comments;
CREATE TRIGGER update_comments_modtime
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Create share_type ENUM
DO $$ BEGIN
    CREATE TYPE share_type_enum AS ENUM ('copy_link', 'whatsapp', 'twitter', 'facebook', 'download');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    share_type share_type_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_media_id ON likes(media_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_media_id ON shares(media_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);

-- RLS Policies for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert their own shares" ON shares;
DROP POLICY IF EXISTS "Anyone with media access can view shares" ON shares;

CREATE POLICY "Authenticated users can insert their own shares" ON shares 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Anyone with media access can view shares" ON shares 
    FOR SELECT USING (EXISTS (SELECT 1 FROM media WHERE media.id = shares.media_id));

-- Update likes & comments RLS to ensure edit/delete only by owner
-- We already have DELETE policies in schema.sql, need UPDATE for comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments 
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for new table
ALTER PUBLICATION supabase_realtime ADD TABLE shares;
