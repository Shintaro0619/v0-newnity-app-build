-- Database Verification Script for test9/test10 Campaigns
-- This script checks the campaign data and blockchain_campaign_id setup

-- 1. Check test9 and test10 campaigns exist and their blockchain IDs
SELECT 
  id,
  title,
  blockchain_campaign_id,
  status,
  goal_amount,
  raised_amount,
  end_date,
  creator_id,
  contract_tx_hash,
  escrow_address,
  created_at
FROM campaigns
WHERE title ILIKE '%test9%' OR title ILIKE '%test10%'
ORDER BY created_at DESC;

-- 2. Check if blockchain_campaign_id is set (should not be NULL)
SELECT 
  id,
  title,
  blockchain_campaign_id,
  CASE 
    WHEN blockchain_campaign_id IS NULL THEN '❌ Missing blockchain_campaign_id'
    ELSE '✅ blockchain_campaign_id is set'
  END as blockchain_id_status
FROM campaigns
WHERE title ILIKE '%test9%' OR title ILIKE '%test10%';

-- 3. Check pledges for test9/test10 campaigns
SELECT 
  p.id,
  p.campaign_id,
  c.title as campaign_title,
  p.backer_id,
  p.amount,
  p.status,
  p.tx_hash,
  p.created_at
FROM pledges p
JOIN campaigns c ON p.campaign_id = c.id
WHERE c.title ILIKE '%test9%' OR c.title ILIKE '%test10%'
ORDER BY p.created_at DESC;

-- 4. Summary: Campaign readiness for finalize testing
SELECT 
  c.title,
  c.blockchain_campaign_id,
  c.status,
  c.goal_amount,
  c.raised_amount,
  COUNT(p.id) as total_pledges,
  SUM(p.amount) as total_pledged_amount,
  CASE 
    WHEN c.blockchain_campaign_id IS NULL THEN '❌ Cannot finalize - Missing blockchain_campaign_id'
    WHEN c.end_date > NOW() THEN '⏳ Campaign still active'
    WHEN c.raised_amount >= c.goal_amount THEN '✅ Ready to finalize as SUCCESS'
    ELSE '✅ Ready to finalize as FAILURE (refunds needed)'
  END as finalize_status
FROM campaigns c
LEFT JOIN pledges p ON c.id = p.campaign_id
WHERE c.title ILIKE '%test9%' OR c.title ILIKE '%test10%'
GROUP BY c.id, c.title, c.blockchain_campaign_id, c.status, c.goal_amount, c.raised_amount, c.end_date;
