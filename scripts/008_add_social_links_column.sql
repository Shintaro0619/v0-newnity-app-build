-- Add social_links column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN campaigns.social_links IS 'Social media links for the campaign (website, x, instagram, youtube, tiktok)';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'campaigns' AND column_name = 'social_links';
