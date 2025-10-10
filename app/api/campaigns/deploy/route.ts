import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, blockchainCampaignId, txHash } = body

    if (!campaignId || blockchainCampaignId === undefined) {
      return NextResponse.json({ error: "Campaign ID and blockchain campaign ID are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE campaigns 
      SET 
        blockchain_campaign_id = ${blockchainCampaignId},
        contract_tx_hash = ${txHash || null},
        status = 'ACTIVE',
        start_date = NOW(),
        updated_at = NOW()
      WHERE id = ${campaignId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    console.log("[v0] Campaign deployed successfully:", {
      campaignId,
      blockchainCampaignId,
      status: result[0].status,
    })

    return NextResponse.json({
      success: true,
      campaign: result[0],
    })
  } catch (error) {
    console.error("[v0] Campaign deployment error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
