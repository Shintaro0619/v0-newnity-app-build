-- 残っているキャンペーンを確認
SELECT 
  id,
  title,
  blockchain_campaign_id,
  creator,
  current_status,
  created_at
FROM campaigns
ORDER BY created_at DESC;
