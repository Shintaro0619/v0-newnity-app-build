export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { publicClient } from "@/lib/viem-server"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"

const contractAddress = process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA as `0x${string}`

async function resolveIds(idOrChainId: string) {
  const isNum = /^\d+$/.test(idOrChainId)
  if (isNum) {
    const r = await sql`SELECT id FROM campaigns WHERE blockchain_campaign_id = ${Number(idOrChainId)} LIMIT 1`
    return { dbId: r?.[0]?.id ?? null, chainId: Number(idOrChainId) }
  } else {
    const r =
      await sql`SELECT blockchain_campaign_id AS chain_id FROM campaigns WHERE id::text = ${idOrChainId} LIMIT 1`
    return { dbId: idOrChainId, chainId: Number(r?.[0]?.chain_id) }
  }
}

async function readOnChain(chainId: number) {
  const args = [BigInt(chainId)]
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getCampaign",
    args,
  })

  const [creator, goal, pledged, deadline, finalized, successful] = result as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    boolean,
    boolean,
    bigint,
  ]

  return {
    finalized: Boolean(finalized),
    goal: BigInt(goal),
    pledged: BigInt(pledged),
    deadline: Number(deadline),
    successful: Boolean(successful),
    creator,
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { txHash, chainId: chainIdRaw } = await req.json()
    const { dbId, chainId } = await resolveIds(chainIdRaw || params.id)

    console.log("[v0] [API] after-finalize called:", { dbId, chainId, txHash })

    if (txHash) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        confirmations: 1,
      })
      if (receipt.status !== "success") {
        console.error("[v0] [API] finalize tx failed:", receipt)
        return NextResponse.json({ ok: false, error: "finalize tx failed" }, { status: 500 })
      }
      console.log("[v0] [API] Transaction confirmed:", receipt.transactionHash)
    }

    const chain = await readOnChain(chainId)
    console.log("[v0] [API] Blockchain data:", chain)

    let newStatus: "SUCCESSFUL" | "FAILED" | "ACTIVE" | "ENDED" = "ACTIVE"
    const now = Math.floor(Date.now() / 1000)
    if (chain.finalized) {
      newStatus = chain.successful ? "SUCCESSFUL" : "FAILED"
    } else if (now > chain.deadline) {
      newStatus = "ENDED"
    }

    console.log("[v0] [API] Determined status:", newStatus)

    const updated = await sql`
      UPDATE campaigns
         SET status = ${newStatus}, updated_at = NOW()
       WHERE id::text = ${dbId}::text
          OR blockchain_campaign_id = ${chainId}
       RETURNING id, status
    `

    console.log("[v0] [API] Database updated:", updated)

    return NextResponse.json(
      {
        ok: true,
        status: updated?.[0]?.status ?? newStatus,
        chain: {
          finalized: chain.finalized,
          successful: chain.successful,
          pledged: chain.pledged.toString(),
          goal: chain.goal.toString(),
        },
      },
      { headers: { "cache-control": "no-store" } },
    )
  } catch (e: any) {
    console.error("[v0] [API] after-finalize error:", e)
    return NextResponse.json({ ok: false, error: e?.message ?? "after-finalize failed" }, { status: 500 })
  }
}
