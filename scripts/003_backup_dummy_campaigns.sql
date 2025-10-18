-- Backup campaigns without blockchain_id (dummy campaigns)
-- This script will show all campaigns that will be deleted

SELECT 
  id,
  title,
  description,
  goal,
  deadline,
  creator,
  blockchain_id,
  created_at
FROM campaigns
WHERE blockchain_id IS NULL
ORDER BY created_at DESC;

-- Also backup related tiers
SELECT 
  t.id,
  t.campaign_id,
  t.title,
  t.description,
  t.amount,
  c.title as campaign_title
FROM tiers t
JOIN campaigns c ON t.campaign_id = c.id
WHERE c.blockchain_id IS NULL
ORDER BY c.created_at DESC, t.amount ASC;

-- Also backup related pledges (if any)
SELECT 
  p.id,
  p.campaign_id,
  p.user_address,
  p.amount,
  p.tier_id,
  c.title as campaign_title
FROM pledges p
JOIN campaigns c ON p.campaign_id = c.id
WHERE c.blockchain_id IS NULL
ORDER BY p.created_at DESC;
