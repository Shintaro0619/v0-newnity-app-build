import { publicClient } from "@/lib/viem-server"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { getContractAddress } from "@/lib/contracts/contract-addresses"
import { baseSepolia } from "viem/chains"

export interface CampaignOnChain {
  finalized: boolean
  successful: boolean
  totalPledged: bigint
  goal: bigint
  deadline: number
  creator: string
}

export async function getCampaignOnChain(blockchainCampaignId: string | number): Promise<CampaignOnChain> {
  const campaignId = BigInt(blockchainCampaignId)
  const escrowAddress = getContractAddress(baseSepolia.id, "campaignEscrow")

  console.log("[v0] [SERVER] getCampaignOnChain called with:", { blockchainCampaignId, escrowAddress })

  const campaignData = await publicClient.readContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getCampaign",
    args: [campaignId],
  })

  const result = {
    creator: campaignData[0] as string,
    goal: campaignData[1] as bigint,
    totalPledged: campaignData[2] as bigint,
    deadline: Number(campaignData[3]),
    finalized: campaignData[4] as boolean,
    successful: campaignData[5] as boolean,
  }

  console.log("[v0] [SERVER] getCampaignOnChain result:", {
    ...result,
    goal: result.goal.toString(),
    totalPledged: result.totalPledged.toString(),
  })

  return result
}
