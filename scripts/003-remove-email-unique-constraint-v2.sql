-- 003-remove-email-unique-constraint-v2.sql
-- Purpose: Remove UNIQUE constraint from users.email to allow multiple wallets to use the same email
-- Impact: Minimal - only affects email constraint, wallet_address remains the primary key
-- Version: 2 (Simplified for easier execution)

-- Step 1: Remove the UNIQUE constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- Step 2: Create a non-unique index for efficient email searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email));

-- Verification query (optional - uncomment to check)
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.users'::regclass;
