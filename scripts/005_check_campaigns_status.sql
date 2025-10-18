-- Check current campaigns and their blockchain status
SELECT 
  id,
  title,
  blockchain_id,
  CASE 
    WHEN blockchain_id IS NOT NULL THEN 'On-chain'
    ELSE 'Dummy (not deployed)'
  END as status,
  created_at
FROM campaigns
ORDER BY created_at DESC;

-- Count campaigns by status
SELECT 
  CASE 
    WHEN blockchain_id IS NOT NULL THEN 'On-chain'
    ELSE 'Dummy (not deployed)'
  END as status,
  COUNT(*) as count
FROM campaigns
GROUP BY (blockchain_id IS NOT NULL);
