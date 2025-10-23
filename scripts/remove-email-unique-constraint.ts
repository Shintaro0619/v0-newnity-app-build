import { neon } from "@neondatabase/serverless"

async function removeEmailUniqueConstraint() {
  console.log("[v0] Starting migration: Remove UNIQUE constraint from users.email")

  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Step 1: Remove the UNIQUE constraint if it exists
    console.log("[v0] Step 1: Checking for existing UNIQUE constraint...")

    const constraintCheck = await sql`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'users_email_key' 
        AND conrelid = 'public.users'::regclass
    `

    if (constraintCheck.length > 0) {
      console.log("[v0] Found constraint: users_email_key. Removing...")
      await sql`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key`
      console.log("[v0] ✓ Successfully removed UNIQUE constraint: users_email_key")
    } else {
      console.log("[v0] ℹ Constraint users_email_key does not exist, skipping")
    }

    // Step 2: Create a non-unique index for efficient email searches
    console.log("[v0] Step 2: Creating non-unique index for email searches...")

    const indexCheck = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE indexname = 'idx_users_email_lower' 
        AND tablename = 'users'
    `

    if (indexCheck.length === 0) {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_users_email_lower 
        ON public.users (LOWER(email))
      `
      console.log("[v0] ✓ Successfully created index: idx_users_email_lower")
    } else {
      console.log("[v0] ℹ Index idx_users_email_lower already exists, skipping")
    }

    // Step 3: Verification
    console.log("[v0] Step 3: Verifying changes...")

    const finalCheck = await sql`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'users_email_key' 
        AND conrelid = 'public.users'::regclass
    `

    if (finalCheck.length === 0) {
      console.log("[v0] ✓ Verification successful: UNIQUE constraint has been removed")
      console.log("[v0] ✓ Multiple wallets can now use the same email address")
    } else {
      console.log("[v0] ⚠ Warning: Constraint still exists after removal attempt")
    }

    console.log("[v0] Migration completed successfully!")
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    throw error
  }
}

// Execute the migration
removeEmailUniqueConstraint()
