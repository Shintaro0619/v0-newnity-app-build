import { NextResponse } from "next/server"
import { getCampaignOnChain } from "@/lib/chain"
import { sql } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { force = false } = await req.json().catch(() => ({ force: false }))
    const id = params.id

    console.log("[v0] [SERVER] Sync API called:", { id, force })

    // First, get the blockchain_campaign_id from the database
    const campaignRow = await sql`
      SELECT id, blockchain_campaign_id, status, goal_amount, raised_amount
      FROM campaigns
      WHERE id::text = ${id} OR blockchain_campaign_id = ${Number(id)}
      LIMIT 1
    `

    if (!campaignRow || campaignRow.length === 0) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 })
    }

    const campaign = campaignRow[0]
    const blockchainCampaignId = campaign.blockchain_campaign_id

    if (!blockchainCampaignId) {
      return NextResponse.json({ ok: false, error: "Campaign not deployed to blockchain" }, { status: 400 })
    }

    // Get on-chain state
    const chain = await getCampaignOnChain(blockchainCampaignId)

    // Determine database status
    let status: "SUCCESSFUL" | "FAILED" | "ENDED" | "ACTIVE" = campaign.status
    const now = Date.now() / 1000

    if (chain.finalized) {
      status = chain.successful ? "SUCCESSFUL" : "FAILED"
    } else if (now > chain.deadline) {
      status = "ENDED"
    }

    // Convert totalPledged from wei to USDC (6 decimals)
    const raisedAmount = Number(chain.totalPledged) / 1e6

    console.log("[v0] [SERVER] Updating campaign status:", {
      campaignId: campaign.id,
      oldStatus: campaign.status,
      newStatus: status,
      oldRaisedAmount: campaign.raised_amount,
      newRaisedAmount: raisedAmount,
    })

    // Update database
    const updatedRow = await sql`
      UPDATE campaigns
      SET status = ${status},
          raised_amount = ${raisedAmount},
          updated_at = NOW()
      WHERE id = ${campaign.id}
      RETURNING id, status, raised_amount
    `

    console.log("[v0] [SERVER] Campaign updated:", updatedRow[0])

    return NextResponse.json({
      ok: true,
      status: updatedRow[0]?.status ?? status,
      raisedAmount: updatedRow[0]?.raised_amount ?? raisedAmount,
      chain: {
        finalized: chain.finalized,
        successful: chain.successful,
        totalPledged: chain.totalPledged.toString(),
        goal: chain.goal.toString(),
        deadline: chain.deadline,
      },
    })
  } catch (e: any) {
    console.error("[v0] [SERVER] Sync API error:", e)
    return NextResponse.json({ ok: false, error: e?.message ?? "sync failed" }, { status: 500 })
  }
}
