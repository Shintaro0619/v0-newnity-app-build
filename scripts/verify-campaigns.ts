// TypeScript script to verify campaign data programmatically
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function verifyCampaigns() {
  console.log("[v0] Starting campaign verification...\n")

  try {
    // 1. Get test9/test10 campaigns
    console.log("1. Checking test9/test10 campaigns:")
    const campaigns = await sql`
      SELECT 
        id,
        title,
        blockchain_campaign_id,
        status,
        goal_amount,
        raised_amount,
        end_date,
        creator_id
      FROM campaigns
      WHERE title ILIKE '%test9%' OR title ILIKE '%test10%'
      ORDER BY created_at DESC
    `

    console.log(`   Found ${campaigns.length} campaign(s)`)
    campaigns.forEach((c: any) => {
      console.log(`   - ${c.title}`)
      console.log(`     ID: ${c.id}`)
      console.log(`     Blockchain ID: ${c.blockchain_campaign_id || "❌ NOT SET"}`)
      console.log(`     Status: ${c.status}`)
      console.log(`     Goal: ${c.goal_amount} / Raised: ${c.raised_amount}`)
      console.log(`     End Date: ${c.end_date}`)
      console.log("")
    })

    // 2. Check pledges
    console.log("2. Checking pledges for test campaigns:")
    const pledges = await sql`
      SELECT 
        p.id,
        p.campaign_id,
        c.title as campaign_title,
        p.amount,
        p.status,
        p.backer_id
      FROM pledges p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE c.title ILIKE '%test9%' OR c.title ILIKE '%test10%'
      ORDER BY p.created_at DESC
    `

    console.log(`   Found ${pledges.length} pledge(s)`)
    pledges.forEach((p: any) => {
      console.log(`   - Campaign: ${p.campaign_title}`)
      console.log(`     Amount: ${p.amount}`)
      console.log(`     Status: ${p.status}`)
      console.log(`     Backer: ${p.backer_id}`)
      console.log("")
    })

    // 3. Finalize readiness check
    console.log("3. Finalize readiness check:")
    campaigns.forEach((c: any) => {
      console.log(`   Campaign: ${c.title}`)

      if (!c.blockchain_campaign_id) {
        console.log(`   ❌ BLOCKER: Missing blockchain_campaign_id`)
      } else {
        console.log(`   ✅ Blockchain ID is set: ${c.blockchain_campaign_id}`)
      }

      const isExpired = new Date(c.end_date) < new Date()
      if (!isExpired) {
        console.log(`   ⏳ Campaign still active (ends: ${c.end_date})`)
      } else {
        console.log(`   ✅ Campaign expired, ready for finalize`)
      }

      const isSuccessful = Number.parseFloat(c.raised_amount) >= Number.parseFloat(c.goal_amount)
      if (isSuccessful) {
        console.log(`   ✅ Goal reached - Will finalize as SUCCESS`)
      } else {
        console.log(`   ⚠️  Goal not reached - Will finalize as FAILURE (refunds needed)`)
      }

      console.log("")
    })

    console.log("[v0] Verification complete!")
  } catch (error) {
    console.error("[v0] Error during verification:", error)
    throw error
  }
}

verifyCampaigns()
