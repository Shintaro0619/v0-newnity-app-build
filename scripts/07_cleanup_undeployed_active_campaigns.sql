-- Clean up campaigns that are ACTIVE but not deployed to blockchain
-- These are campaigns created before the DRAFT status was implemented

DELETE FROM campaigns
WHERE status = 'ACTIVE'
AND blockchain_campaign_id IS NULL;

-- Verify cleanup
SELECT id, title, status, blockchain_campaign_id
FROM campaigns
WHERE status = 'ACTIVE';
