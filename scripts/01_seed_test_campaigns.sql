-- Seed test campaigns for development
-- This script creates sample campaigns with various statuses

-- Insert test users first
INSERT INTO users (id, name, email, avatar, bio, wallet_address, created_at, updated_at)
VALUES 
  ('test-user-1', 'Alex Chen', 'alex@example.com', '/placeholder.svg?height=100&width=100', 'Game developer and VR enthusiast', '0x1234567890abcdef1234567890abcdef12345678', NOW(), NOW()),
  ('test-user-2', 'Sarah Kim', 'sarah@example.com', '/placeholder.svg?height=100&width=100', 'Digital artist and NFT creator', '0x2234567890abcdef1234567890abcdef12345678', NOW(), NOW()),
  ('test-user-3', 'Mike Johnson', 'mike@example.com', '/placeholder.svg?height=100&width=100', 'Tech entrepreneur and blockchain advocate', '0x3234567890abcdef1234567890abcdef12345678', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test campaigns
INSERT INTO campaigns (
  id,
  title,
  description,
  story,
  goal_amount,
  raised_amount,
  creator_id,
  category,
  tags,
  cover_image,
  gallery,
  video_url,
  status,
  start_date,
  end_date,
  duration,
  currency,
  platform_fee,
  contract_tx_hash,
  escrow_address,
  created_at,
  updated_at
) VALUES 
  (
    'campaign-test-1',
    'Revolutionary VR Game: Neon Worlds',
    'Experience the future of gaming with our immersive VR adventure',
    'Neon Worlds is an ambitious VR game that combines cutting-edge technology with compelling storytelling. Set in a dystopian cyberpunk future, players will navigate through neon-lit streets, hack into corporate systems, and uncover a conspiracy that threatens humanity.',
    50000,
    32500,
    'test-user-1',
    'gaming',
    ARRAY['vr', 'cyberpunk', 'action'],
    '/placeholder.svg?height=400&width=600',
    ARRAY['/placeholder.svg?height=400&width=600', '/placeholder.svg?height=400&width=600'],
    NULL,
    'ACTIVE',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '23 days',
    30,
    'USDC',
    5,
    NULL,
    NULL,
    NOW() - INTERVAL '7 days',
    NOW()
  ),
  (
    'campaign-test-2',
    'Anime Art Collection: Digital Dreams',
    'A stunning collection of original anime artwork',
    'Digital Dreams is a curated collection of 50 original anime artworks that blend traditional anime aesthetics with futuristic sci-fi elements. Each piece tells a story and captures the essence of dreams in a digital age.',
    25000,
    18750,
    'test-user-2',
    'art',
    ARRAY['anime', 'digital-art', 'nft'],
    '/placeholder.svg?height=400&width=600',
    ARRAY['/placeholder.svg?height=400&width=600', '/placeholder.svg?height=400&width=600'],
    NULL,
    'ACTIVE',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    30,
    'USDC',
    5,
    NULL,
    NULL,
    NOW() - INTERVAL '15 days',
    NOW()
  ),
  (
    'campaign-test-3',
    'VTuber Debut: Luna''s Space Adventure',
    'Help Luna launch her VTuber career',
    'Join Luna on her journey to become a VTuber! With your support, Luna will be able to purchase professional streaming equipment, commission a high-quality 3D avatar, and create engaging content for the community.',
    15000,
    12300,
    'test-user-3',
    'vtuber',
    ARRAY['vtuber', 'streaming', 'entertainment'],
    '/placeholder.svg?height=400&width=600',
    ARRAY['/placeholder.svg?height=400&width=600', '/placeholder.svg?height=400&width=600'],
    NULL,
    'ACTIVE',
    NOW() - INTERVAL '22 days',
    NOW() + INTERVAL '8 days',
    30,
    'USDC',
    5,
    NULL,
    NULL,
    NOW() - INTERVAL '22 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert some test pledges
INSERT INTO pledges (id, campaign_id, backer_id, amount, status, transaction_hash, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'campaign-test-1', 'test-user-2', 100, 'CONFIRMED', '0xabc123', NOW(), NOW()),
  (gen_random_uuid(), 'campaign-test-1', 'test-user-3', 250, 'CONFIRMED', '0xdef456', NOW(), NOW()),
  (gen_random_uuid(), 'campaign-test-2', 'test-user-1', 50, 'CONFIRMED', '0xghi789', NOW(), NOW()),
  (gen_random_uuid(), 'campaign-test-2', 'test-user-3', 75, 'CONFIRMED', '0xjkl012', NOW(), NOW()),
  (gen_random_uuid(), 'campaign-test-3', 'test-user-1', 25, 'CONFIRMED', '0xmno345', NOW(), NOW()),
  (gen_random_uuid(), 'campaign-test-3', 'test-user-2', 100, 'CONFIRMED', '0xpqr678', NOW(), NOW())
ON CONFLICT DO NOTHING;
