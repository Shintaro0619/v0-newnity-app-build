"use server"

import { sql } from "@vercel/postgres"

export async function resetCampaignStatus(campaignId: string) {
  try {
    console.log("[v0] Resetting campaign status for:", campaignId)

    // Update the campaign status to ACTIVE
    const result = await sql`
      UPDATE campaigns
      SET status = 'ACTIVE',
          updated_at = NOW()
      WHERE id = ${campaignId}
      RETURNING id, title, status
    `

    console.log("[v0] Campaign status reset result:", result.rows[0])

    return {
      success: true,
      campaign: result.rows[0],
    }
  } catch (error) {
    console.error("[v0] Failed to reset campaign status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
