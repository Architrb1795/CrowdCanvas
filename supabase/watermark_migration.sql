-- Add watermark settings to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS watermark_text TEXT,
ADD COLUMN IF NOT EXISTS watermark_style TEXT DEFAULT 'bottom_right' CHECK (watermark_style IN ('bottom_right', 'diagonal', 'badge', 'logo')),
ADD COLUMN IF NOT EXISTS watermark_opacity INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS watermark_size INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS watermark_logo_url TEXT;

-- Track watermarked downloads in the shares table
ALTER TABLE shares
ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT false;
