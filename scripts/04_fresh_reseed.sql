-- Fresh database reseed script
-- Clears all data and inserts test data
-- No sequence operations (IDs are TEXT type)

-- Clear existing data
DELETE FROM pledges;
DELETE FROM tiers;
DELETE FROM milestones;
DELETE FROM review_flags;
DELETE FROM credit_ledger;
DELETE FROM campaigns;
DELETE FROM users;

-- Insert test users
INSERT INTO users (id, wallet_address, name, email, created_at, updated_at) VALUES
('user-test-001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 'Alice Creator', 'alice@test.com', NOW(), NOW()),
('user-test-002', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'Bob Backer', 'bob@test.com', NOW(), NOW()),
('user-test-003', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'Charlie Supporter', 'charlie@test.com', NOW(), NOW());

-- Insert test campaigns
-- Updated status from 'active' to 'ACTIVE' to match CampaignStatus enum
INSERT INTO campaigns (
  id, creator_id, title, description, story, category,
  goal_amount, raised_amount, currency, duration,
  start_date, end_date, cover_image, status,
  created_at, updated_at
) VALUES
(
  'camp-test-001', 'user-test-001',
  'Decentralized Social Network',
  'Building the next generation of social media on blockchain',
  'Privacy-first, user-owned social network. No ads, no data mining.',
  'Web3', 50000, 0, 'USDC', 30,
  NOW(), NOW() + INTERVAL '30 days',
  '/placeholder.svg?height=400&width=600', 'ACTIVE',
  NOW(), NOW()
),
(
  'camp-test-002', 'user-test-001',
  'NFT Art Gallery Platform',
  'Curated platform for digital artists',
  'Zero platform fees, artist-first approach.',
  'Digital', 30000, 0, 'USDC', 20,
  NOW(), NOW() + INTERVAL '20 days',
  '/placeholder.svg?height=400&width=600', 'ACTIVE',
  NOW(), NOW()
),
(
  'camp-test-003', 'user-test-002',
  'Blockchain Gaming Tournament',
  'Largest Web3 gaming tournament',
  'Compete for cryptocurrency and NFT rewards.',
  'Games', 100000, 0, 'USDC', 45,
  NOW(), NOW() + INTERVAL '45 days',
  '/placeholder.svg?height=400&width=600', 'ACTIVE',
  NOW(), NOW()
);

-- Insert test pledges
-- Updated status from 'confirmed' to 'CONFIRMED' to match PledgeStatus enum
INSERT INTO pledges (
  id, campaign_id, backer_id, amount, currency,
  status, tx_hash, created_at, updated_at
) VALUES
('pledge-test-001', 'camp-test-001', 'user-test-002', 5000, 'USDC', 'CONFIRMED', '0xabc123', NOW(), NOW()),
('pledge-test-002', 'camp-test-001', 'user-test-003', 3000, 'USDC', 'CONFIRMED', '0xdef456', NOW(), NOW()),
('pledge-test-003', 'camp-test-002', 'user-test-003', 10000, 'USDC', 'CONFIRMED', '0xghi789', NOW(), NOW());

-- Verify results
SELECT 'Database Reset Complete' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as campaign_count FROM campaigns;
SELECT COUNT(*) as pledge_count FROM pledges;
