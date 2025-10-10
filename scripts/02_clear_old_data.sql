-- Clear old dummy data from campaigns table
-- Run this if you want to remove old test data and keep only the seeded campaigns

DELETE FROM pledges;
DELETE FROM campaigns;

-- Reset the sequence to start from 1
ALTER SEQUENCE campaigns_id_seq RESTART WITH 1;
ALTER SEQUENCE pledges_id_seq RESTART WITH 1;

-- Note: After running this, run 01_seed_test_campaigns.sql again to repopulate with fresh data
