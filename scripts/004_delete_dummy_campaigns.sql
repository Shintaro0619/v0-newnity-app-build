-- Delete dummy campaigns (campaigns without blockchain_id)
-- WARNING: This will permanently delete campaigns that are not deployed on-chain

-- First, delete related pledges
DELETE FROM pledges
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE blockchain_id IS NULL
);

-- Then, delete related tiers
DELETE FROM tiers
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE blockchain_id IS NULL
);

-- Finally, delete the campaigns
DELETE FROM campaigns
WHERE blockchain_id IS NULL;

-- Show remaining campaigns (should only be on-chain campaigns)
SELECT 
  id,
  title,
  blockchain_id,
  created_at
FROM campaigns
ORDER BY created_at DESC;
