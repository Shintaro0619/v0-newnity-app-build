-- Remove UNIQUE constraint from users.email to allow multiple wallets to use the same email
-- This is necessary because users may have multiple wallets but want to use the same email address

-- Drop the unique constraint on email if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Ensure wallet_address is the primary key (it should already be, but let's make sure)
-- If wallet_address is not already a primary key, this will add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_pkey'
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD PRIMARY KEY (wallet_address);
  END IF;
END $$;

-- Add a comment to document this change
COMMENT ON TABLE users IS 'User profiles. wallet_address is the primary key. Multiple wallets can share the same email address.';
