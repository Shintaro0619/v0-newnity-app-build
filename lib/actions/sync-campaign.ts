"use server"

import { sql } from "@/lib/db"
import { publicClient } from "@/lib/viem-server"
import escrowAbi from "@/lib/contracts/campaign-escrow-abi"

type SyncResult = {
  updated: boolean
  status: "SUCCESSFUL" | "FAILED" | "ACTIVE"
  finalized: boolean
  successful: boolean
}

export async function syncCampaignFromChain(campaignId: number): Promise<SyncResult> {
  console.log("[v0] [SERVER] syncCampaignFromChain called with campaignId:", campaignId)

  try {
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA as `0x${string}`

    const data = (await publicClient.readContract({
      address: escrowAddress,
      abi: escrowAbi,
      functionName: "getCampaign",
      args: [BigInt(campaignId)],
    })) as {
      finalized: boolean
      successful: boolean
      totalPledged: bigint
      goal: bigint
      deadline: bigint
      creator: `0x${string}`
    }

    console.log("[v0] [SERVER] Blockchain data:", {
      finalized: data.finalized,
      successful: data.successful,
      totalPledged: data.totalPledged.toString(),
      goal: data.goal.toString(),
    })

    if (!data.finalized) {
      console.log("[v0] [SERVER] Campaign not finalized on blockchain")
      return {
        updated: false,
        status: "ACTIVE",
        finalized: false,
        successful: false,
      }
    }

    const newStatus = data.successful ? "SUCCESSFUL" : "FAILED"
    console.log("[v0] [SERVER] Updating DB status to:", newStatus)

    await sql`
      UPDATE campaigns
      SET status = ${newStatus},
          finalized_at = NOW(),
          refund_available = ${newStatus === "FAILED"}
      WHERE blockchain_campaign_id = ${campaignId}
    `

    console.log("[v0] [SERVER] Database updated successfully")

    return {
      updated: true,
      status: newStatus,
      finalized: true,
      successful: data.successful,
    }
  } catch (error) {
    console.error("[v0] [SERVER] syncCampaignFromChain error:", error)
    throw error
  }
}
