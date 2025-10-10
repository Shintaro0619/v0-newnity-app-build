-- Seed data for newnity platform
-- This creates sample users, campaigns, tiers, and pledges for testing

-- Insert sample users
INSERT INTO users (id, email, name, avatar, bio, wallet_address, kyc_status, country, xp_total, reputation) VALUES
('user_1', 'alice@example.com', 'Alice Creator', '/avatars/alice.jpg', 'Indie game developer passionate about pixel art adventures', '0x1234567890123456789012345678901234567890', 'APPROVED', 'US', 1250, 95),
('user_2', 'bob@example.com', 'Bob Musician', '/avatars/bob.jpg', 'Electronic music producer exploring Web3 soundscapes', '0x2345678901234567890123456789012345678901', 'APPROVED', 'JP', 890, 87),
('user_3', 'carol@example.com', 'Carol Backer', '/avatars/carol.jpg', 'Crypto enthusiast supporting innovative projects', '0x3456789012345678901234567890123456789012', 'APPROVED', 'CA', 2100, 78),
('user_4', 'david@example.com', 'David Artist', '/avatars/david.jpg', 'Digital artist creating NFT collections and interactive experiences', '0x4567890123456789012345678901234567890123', 'PENDING', 'UK', 450, 92),
('user_5', 'eve@example.com', 'Eve Supporter', '/avatars/eve.jpg', 'Early adopter of decentralized crowdfunding platforms', '0x5678901234567890123456789012345678901234', 'APPROVED', 'DE', 1680, 85);

-- Insert sample campaigns
INSERT INTO campaigns (id, title, description, story, goal_amount, raised_amount, currency, duration, category, tags, status, start_date, end_date, cover_image, creator_id) VALUES
('camp_1', 'Pixel Quest: Retro RPG Adventure', 'A nostalgic 16-bit RPG with modern gameplay mechanics and blockchain integration', 'Growing up with classic JRPGs, I always dreamed of creating my own adventure. Pixel Quest combines the charm of retro graphics with innovative Web3 features, allowing players to truly own their in-game assets and participate in the game''s economy.', 50000.00, 32500.00, 'USDC', 30, 'Gaming', ARRAY['RPG', 'Pixel Art', 'Web3', 'NFT'], 'ACTIVE', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', '/campaigns/pixel-quest-cover.jpg', 'user_1'),

('camp_2', 'Synthwave Dreams: Electronic Album', 'A concept album exploring the intersection of retro-futurism and blockchain technology', 'Music has always been my way of expressing the future I envision. This album will be released as a collection of NFTs, with each track telling a story of our digital evolution. Backers will receive exclusive access to stems, remixes, and behind-the-scenes content.', 25000.00, 18750.00, 'USDC', 45, 'Music', ARRAY['Electronic', 'Synthwave', 'NFT', 'Album'], 'ACTIVE', NOW() - INTERVAL '10 days', NOW() + INTERVAL '35 days', '/campaigns/synthwave-dreams-cover.jpg', 'user_2'),

('camp_3', 'Digital Consciousness: AI Art Series', 'An exploration of artificial intelligence through generative art and interactive installations', 'What does it mean to be conscious in a digital age? This series of AI-generated artworks will be displayed in both virtual galleries and physical exhibitions, questioning the boundaries between human and machine creativity.', 75000.00, 12000.00, 'USDC', 60, 'Art', ARRAY['AI', 'Generative Art', 'Installation', 'Philosophy'], 'ACTIVE', NOW() - INTERVAL '5 days', NOW() + INTERVAL '55 days', '/campaigns/digital-consciousness-cover.jpg', 'user_4'),

('camp_4', 'Completed Game Project', 'A successfully funded indie game that reached its goal', 'This project successfully demonstrated the power of community-driven funding in the Web3 space.', 30000.00, 35000.00, 'USDC', 30, 'Gaming', ARRAY['Indie', 'Completed', 'Success'], 'SUCCESSFUL', NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days', '/campaigns/completed-game-cover.jpg', 'user_1');

-- Insert sample tiers for campaigns
INSERT INTO tiers (id, title, description, amount, max_backers, is_limited, rewards, estimated_delivery, campaign_id) VALUES
-- Pixel Quest tiers
('tier_1', 'Early Bird Digital Copy', 'Get the game at launch with exclusive early bird pricing', 25.00, 500, true, ARRAY['Digital game copy', 'Early access beta', 'Digital soundtrack'], NOW() + INTERVAL '120 days', 'camp_1'),
('tier_2', 'Collector''s Edition', 'Premium package with physical and digital goodies', 75.00, 200, true, ARRAY['Digital game copy', 'Physical art book', 'Soundtrack vinyl', 'Exclusive NFT character'], NOW() + INTERVAL '150 days', 'camp_1'),
('tier_3', 'Developer''s Circle', 'Join the development process and get your name in credits', 150.00, 50, true, ARRAY['All previous rewards', 'Monthly dev calls', 'Name in credits', 'Custom NPC design'], NOW() + INTERVAL '120 days', 'camp_1'),

-- Synthwave Dreams tiers
('tier_4', 'Digital Album', 'High-quality digital album with bonus tracks', 15.00, NULL, false, ARRAY['Digital album (FLAC/MP3)', 'Bonus remixes', 'Digital artwork'], NOW() + INTERVAL '90 days', 'camp_2'),
('tier_5', 'Vinyl + NFT Bundle', 'Limited edition vinyl with exclusive NFT collection', 50.00, 300, true, ARRAY['Vinyl record', 'Digital album', 'Exclusive NFT collection', 'Signed poster'], NOW() + INTERVAL '120 days', 'camp_2'),
('tier_6', 'Producer Access', 'Get access to stems and production files', 100.00, 100, true, ARRAY['All previous rewards', 'Stems and MIDI files', 'Producer credits', 'Private Discord access'], NOW() + INTERVAL '90 days', 'camp_2'),

-- Digital Consciousness tiers
('tier_7', 'Digital Gallery Pass', 'Access to virtual exhibitions and digital prints', 30.00, NULL, false, ARRAY['Virtual gallery access', 'Digital art prints', 'Artist statement'], NOW() + INTERVAL '60 days', 'camp_3'),
('tier_8', 'Physical Print Collection', 'Limited edition physical prints of selected works', 120.00, 100, true, ARRAY['3 physical prints', 'Digital gallery access', 'Certificate of authenticity', 'Artist signature'], NOW() + INTERVAL '90 days', 'camp_3'),
('tier_9', 'Patron of the Arts', 'Exclusive patron benefits and custom commission', 500.00, 20, true, ARRAY['All previous rewards', 'Custom AI art commission', 'Private studio visit', 'Patron recognition'], NOW() + INTERVAL '120 days', 'camp_3');

-- Insert sample pledges
INSERT INTO pledges (id, amount, currency, tx_hash, status, backer_id, campaign_id, tier_id) VALUES
('pledge_1', 25.00, 'USDC', '0xabc123def456789012345678901234567890123456789012345678901234567890', 'CONFIRMED', 'user_3', 'camp_1', 'tier_1'),
('pledge_2', 75.00, 'USDC', '0xdef456abc789012345678901234567890123456789012345678901234567890123', 'CONFIRMED', 'user_5', 'camp_1', 'tier_2'),
('pledge_3', 15.00, 'USDC', '0x123456789012345678901234567890123456789012345678901234567890abcdef', 'CONFIRMED', 'user_3', 'camp_2', 'tier_4'),
('pledge_4', 50.00, 'USDC', '0x456789012345678901234567890123456789012345678901234567890123abcdef', 'CONFIRMED', 'user_5', 'camp_2', 'tier_5'),
('pledge_5', 30.00, 'USDC', '0x789012345678901234567890123456789012345678901234567890123456abcdef', 'CONFIRMED', 'user_3', 'camp_3', 'tier_7'),
('pledge_6', 150.00, 'USDC', '0x012345678901234567890123456789012345678901234567890123456789abcdef', 'CONFIRMED', 'user_5', 'camp_1', 'tier_3');

-- Insert sample milestones
INSERT INTO milestones (id, title, description, target_date, status, campaign_id) VALUES
('mile_1', 'Alpha Build Complete', 'Core gameplay mechanics implemented and playable alpha build ready', NOW() + INTERVAL '30 days', 'IN_PROGRESS', 'camp_1'),
('mile_2', 'Beta Testing Phase', 'Public beta testing with community feedback integration', NOW() + INTERVAL '60 days', 'PENDING', 'camp_1'),
('mile_3', 'Album Recording Complete', 'All tracks recorded and mastered, ready for distribution', NOW() + INTERVAL '45 days', 'IN_PROGRESS', 'camp_2'),
('mile_4', 'NFT Collection Minted', 'Exclusive NFT collection created and ready for distribution', NOW() + INTERVAL '30 days', 'PENDING', 'camp_2');

-- Insert sample credit ledger entries
INSERT INTO credit_ledger (id, amount, type, description, source_type, source_id, user_id) VALUES
('credit_1', 125.50, 'EARNED', 'Yield from pledge to Pixel Quest campaign', 'pledge', 'pledge_1', 'user_3'),
('credit_2', 87.25, 'EARNED', 'Yield from pledge to Synthwave Dreams campaign', 'pledge', 'pledge_3', 'user_3'),
('credit_3', 200.00, 'BONUS', 'Early adopter bonus for platform participation', 'bonus', NULL, 'user_5'),
('credit_4', 50.00, 'SPENT', 'Platform fee discount applied', 'discount', 'pledge_6', 'user_5'),
('credit_5', 75.30, 'EARNED', 'Referral bonus for bringing new users', 'referral', 'user_4', 'user_3');
