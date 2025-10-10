# Database Scripts

This directory contains SQL scripts for database setup and seeding.

## Scripts

### 01_seed_test_campaigns.sql
Seeds the database with test campaigns, users, and pledges for development and testing.

**Usage:**
1. Make sure your Neon database connection is configured in environment variables
2. Run the script from the v0 interface by clicking the "Run Script" button
3. Or execute manually via psql:
   \`\`\`bash
   psql $DATABASE_URL -f scripts/01_seed_test_campaigns.sql
   \`\`\`

**What it creates:**
- 3 test users (Alex Chen, Sarah Kim, Mike Johnson)
- 3 test campaigns in different categories (Gaming, Art, VTuber)
- 6 test pledges distributed across campaigns

**Note:** All INSERT statements use `ON CONFLICT DO NOTHING` to prevent duplicate entries if run multiple times.

## Running Scripts in v0

1. Navigate to the Scripts panel in v0
2. Select the script you want to run
3. Click "Execute"
4. Check the output for any errors

## Database Schema

The scripts assume the following tables exist:
- `users` - User accounts and profiles
- `campaigns` - Campaign information
- `pledges` - Backer pledges to campaigns

If tables don't exist, they will be created automatically by the Neon integration.
