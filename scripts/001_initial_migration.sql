-- Initial migration for newnity platform
-- This creates all the necessary tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    bio TEXT,
    website TEXT,
    wallet_address TEXT UNIQUE,
    kyc_status TEXT DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    kyc_provider TEXT,
    kyc_reference TEXT,
    country TEXT,
    xp_total INTEGER DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    story TEXT,
    goal_amount DECIMAL(18,6) NOT NULL,
    raised_amount DECIMAL(18,6) DEFAULT 0,
    currency TEXT DEFAULT 'USDC',
    platform_fee DECIMAL(5,4) DEFAULT 0.04,
    duration INTEGER NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'ACTIVE', 'SUCCESSFUL', 'FAILED', 'CANCELLED')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    cover_image TEXT,
    gallery TEXT[],
    video_url TEXT,
    escrow_address TEXT,
    contract_tx_hash TEXT,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tiers table
CREATE TABLE IF NOT EXISTS tiers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    max_backers INTEGER,
    is_limited BOOLEAN DEFAULT false,
    rewards TEXT[],
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    shipping_cost DECIMAL(18,6),
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    evidence TEXT,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    voting_ends TIMESTAMP WITH TIME ZONE,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pledges table
CREATE TABLE IF NOT EXISTS pledges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    amount DECIMAL(18,6) NOT NULL,
    currency TEXT DEFAULT 'USDC',
    tx_hash TEXT UNIQUE,
    block_number BIGINT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REFUNDED', 'FAILED')),
    backer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    tier_id TEXT REFERENCES tiers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit ledger table
CREATE TABLE IF NOT EXISTS credit_ledger (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    amount DECIMAL(18,6) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('EARNED', 'SPENT', 'BONUS', 'PENALTY')),
    description TEXT NOT NULL,
    source_type TEXT,
    source_id TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review flags table
CREATE TABLE IF NOT EXISTS review_flags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL CHECK (type IN ('SPAM', 'INAPPROPRIATE', 'FRAUD', 'COPYRIGHT', 'OTHER')),
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    resolution TEXT,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

CREATE INDEX IF NOT EXISTS idx_pledges_backer_id ON pledges(backer_id);
CREATE INDEX IF NOT EXISTS idx_pledges_campaign_id ON pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_tx_hash ON pledges(tx_hash);

CREATE INDEX IF NOT EXISTS idx_tiers_campaign_id ON tiers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_milestones_campaign_id ON milestones(campaign_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_campaign_id ON review_flags(campaign_id);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pledges_updated_at BEFORE UPDATE ON pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_flags_updated_at BEFORE UPDATE ON review_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
