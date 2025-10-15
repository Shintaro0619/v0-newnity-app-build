-- Fix campaign status for test5
-- This script resets the status to ACTIVE so the Finalize button can be shown

UPDATE campaigns
SET status = 'ACTIVE'
WHERE id = '53977cb1-320d-4161-80ba-f0686331d0bd'
AND status = 'FAILED';

-- Verify the update
SELECT id, title, status, end_date, blockchain_campaign_id
FROM campaigns
WHERE id = '53977cb1-320d-4161-80ba-f0686331d0bd';
