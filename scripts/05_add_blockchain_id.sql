-- Add blockchain campaign ID column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "blockchainCampaignId" INTEGER;

-- Add comment explaining the column
COMMENT ON COLUMN campaigns."blockchainCampaignId" IS 'On-chain campaign ID from the CampaignEscrow smart contract';

-- Update existing test campaigns with blockchain IDs (if they exist on-chain)
-- These would be set when campaigns are actually created on the blockchain
UPDATE campaigns SET "blockchainCampaignId" = NULL WHERE "blockchainCampaignId" IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'campaigns' AND column_name = 'blockchainCampaignId';
