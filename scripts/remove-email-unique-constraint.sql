-- Remove UNIQUE constraint from users.email to allow multiple wallets to use the same email
-- This allows users to have multiple wallets with the same email address

-- 1. Drop the UNIQUE constraint on email if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 2. Create a non-unique index for email search performance (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

-- 3. Ensure wallet_address is unique (should already be, but adding for safety)
ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address) ON CONFLICT DO NOTHING;

-- Verification query (optional - for manual testing)
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'users' AND table_schema = 'public';
