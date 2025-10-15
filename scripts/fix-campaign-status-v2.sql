-- Fix campaign status for test5 (Version 2)
-- Force update the status to ACTIVE regardless of current status

BEGIN;

-- Show current status
SELECT 'BEFORE UPDATE:' as stage, id, title, status, end_date, blockchain_campaign_id
FROM campaigns
WHERE id = '53977cb1-320d-4161-80ba-f0686331d0bd';

-- Update status to ACTIVE
UPDATE campaigns
SET 
  status = 'ACTIVE',
  updated_at = NOW()
WHERE id = '53977cb1-320d-4161-80ba-f0686331d0bd';

-- Show updated status
SELECT 'AFTER UPDATE:' as stage, id, title, status, end_date, blockchain_campaign_id
FROM campaigns
WHERE id = '53977cb1-320d-4161-80ba-f0686331d0bd';

COMMIT;
