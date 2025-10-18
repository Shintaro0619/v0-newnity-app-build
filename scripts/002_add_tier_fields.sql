-- Add missing fields to tiers table for Kickstarter-style reward tiers

-- Add minted column to track current backers
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS minted INTEGER DEFAULT 0;

-- Add starts_at and ends_at for time-limited tiers
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Add sort_order for custom tier ordering
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add is_active flag to enable/disable tiers
ALTER TABLE tiers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add min_contribution_usdc to campaigns table for "pledge without reward" minimum
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS min_contribution_usdc BIGINT DEFAULT 1000000; -- 1 USDC in atomic units (6 decimals)

-- Add blockchain_campaign_id if not exists
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS blockchain_campaign_id INTEGER;

-- Create index for tier ordering
CREATE INDEX IF NOT EXISTS idx_tiers_sort_order ON tiers(campaign_id, sort_order);

-- Update existing tiers to have minted count based on pledges
UPDATE tiers t
SET minted = (
  SELECT COUNT(DISTINCT p.backer_id)
  FROM pledges p
  WHERE p.tier_id = t.id AND p.status = 'CONFIRMED'
);
