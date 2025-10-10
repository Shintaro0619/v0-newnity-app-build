-- Add blockchain_campaign_id column to campaigns table
-- This column stores the on-chain campaign ID from the CampaignEscrow smart contract

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS blockchain_campaign_id INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.blockchain_campaign_id IS 'On-chain campaign ID from the CampaignEscrow smart contract (0, 1, 2, etc.)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_blockchain_id ON campaigns(blockchain_campaign_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns' AND column_name = 'blockchain_campaign_id';
