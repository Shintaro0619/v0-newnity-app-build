-- 002-drop-unique-on-users-email.sql
-- Purpose: Remove UNIQUE constraint from users.email to allow multiple wallets to use the same email
-- Impact: Minimal - only affects email constraint, wallet_address remains the primary key

-- 1) Safely remove existing UNIQUE constraint/index
DO $$
BEGIN
  -- Remove constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_key'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_email_key;
    RAISE NOTICE 'Dropped constraint: users_email_key';
  ELSE
    RAISE NOTICE 'Constraint users_email_key does not exist, skipping';
  END IF;

  -- Remove index if it exists (Prisma/Supabase may create this)
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexname = 'users_email_key'
  ) THEN
    DROP INDEX public.users_email_key;
    RAISE NOTICE 'Dropped index: users_email_key';
  ELSE
    RAISE NOTICE 'Index users_email_key does not exist, skipping';
  END IF;
END$$;

-- 2) Create non-unique, case-insensitive index for efficient email searches
CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON public.users (LOWER(email));

RAISE NOTICE 'Created index: idx_users_email_lower';

-- 3) Verify changes (for audit purposes)
-- Uncomment to check constraints after migration:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint 
-- WHERE conrelid='public.users'::regclass;

-- Uncomment to check indexes after migration:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'users';
