-- Delete test campaigns that are not properly deployed
-- This removes campaigns with ACTIVE status but no blockchain_campaign_id

DELETE FROM pledges 
WHERE campaign_id IN (
  SELECT id FROM campaigns 
  WHERE status = 'ACTIVE' 
  AND blockchain_campaign_id IS NULL
);

DELETE FROM campaigns 
WHERE status = 'ACTIVE' 
AND blockchain_campaign_id IS NULL;

-- Update any remaining campaigns with incorrect status
UPDATE campaigns 
SET status = 'DRAFT'
WHERE blockchain_campaign_id IS NULL 
AND status != 'DRAFT';
