-- Complete database reset and reseed
-- This script clears all data and reseeds with fresh test data

-- Step 1: Clear all existing data (in correct order due to foreign keys)
TRUNCATE TABLE pledges CASCADE;
TRUNCATE TABLE tiers CASCADE;
TRUNCATE TABLE milestones CASCADE;
TRUNCATE TABLE review_flags CASCADE;
TRUNCATE TABLE credit_ledger CASCADE;
TRUNCATE TABLE campaigns CASCADE;
TRUNCATE TABLE users CASCADE;

-- Removed sequence resets - IDs are TEXT type (UUIDs), not SERIAL

-- Step 2: Insert test users with UUID-style IDs
INSERT INTO users (id, wallet_address, name, email, created_at, updated_at) VALUES
('user-001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 'Alice Creator', 'alice@example.com', NOW() - INTERVAL '30 days', NOW()),
('user-002', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'Bob Backer', 'bob@example.com', NOW() - INTERVAL '25 days', NOW()),
('user-003', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'Charlie Supporter', 'charlie@example.com', NOW() - INTERVAL '20 days', NOW());

-- Step 3: Insert test campaigns
INSERT INTO campaigns (
  id,
  creator_id,
  title,
  description,
  story,
  category,
  goal_amount,
  raised_amount,
  currency,
  duration,
  start_date,
  end_date,
  cover_image,
  status,
  created_at,
  updated_at
) VALUES
(
  'campaign-001',
  'user-001',
  'Decentralized Social Network',
  'Building the next generation of social media on blockchain',
  'We are creating a privacy-first, user-owned social network that puts control back in the hands of users. No ads, no data mining, just pure social connection.',
  'Web3',
  50000,
  0,
  'USDC',
  30,
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '25 days',
  '/placeholder.svg?height=400&width=600',
  'active',
  NOW() - INTERVAL '5 days',
  NOW()
),
(
  'campaign-002',
  'user-001',
  'NFT Art Gallery Platform',
  'A curated platform for digital artists to showcase and sell their NFT artwork',
  'Zero platform fees, artist-first approach. We believe creators should keep what they earn.',
  'Digital',
  30000,
  0,
  'USDC',
  20,
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '17 days',
  '/placeholder.svg?height=400&width=600',
  'active',
  NOW() - INTERVAL '3 days',
  NOW()
),
(
  'campaign-003',
  'user-002',
  'Blockchain Gaming Tournament',
  'The largest Web3 gaming tournament with crypto prizes',
  'Join thousands of gamers competing for cryptocurrency and NFT rewards. Fair play guaranteed by blockchain technology.',
  'Games',
  100000,
  0,
  'USDC',
  45,
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '43 days',
  '/placeholder.svg?height=400&width=600',
  'active',
  NOW() - INTERVAL '2 days',
  NOW()
);

-- Step 4: Insert test pledges
INSERT INTO pledges (
  id,
  campaign_id,
  backer_id,
  amount,
  currency,
  status,
  tx_hash,
  created_at,
  updated_at
) VALUES
('pledge-001', 'campaign-001', 'user-002', 5000, 'USDC', 'confirmed', '0xabc123def456', NOW() - INTERVAL '2 days', NOW()),
('pledge-002', 'campaign-001', 'user-003', 3000, 'USDC', 'confirmed', '0xdef456ghi789', NOW() - INTERVAL '1 day', NOW()),
('pledge-003', 'campaign-002', 'user-003', 10000, 'USDC', 'confirmed', '0xghi789jkl012', NOW() - INTERVAL '1 day', NOW());

-- Step 5: Verification queries
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'Pledges', COUNT(*) FROM pledges;

-- Show the inserted data
SELECT 'Inserted Users:' as info;
SELECT id, name, wallet_address FROM users ORDER BY created_at;

SELECT 'Inserted Campaigns:' as info;
SELECT id, title, goal_amount, status FROM campaigns ORDER BY created_at;

SELECT 'Inserted Pledges:' as info;
SELECT id, campaign_id, backer_id, amount FROM pledges ORDER BY created_at;
