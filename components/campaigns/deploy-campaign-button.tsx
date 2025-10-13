"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAccount, useWaitForTransactionReceipt, useReadContract, usePublicClient, useWriteContract } from "wagmi"
import { toast } from "sonner"
import { getContractAddress } from "@/lib/wagmi"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { parseUnits, decodeEventLog } from "viem"

interface DeployCampaignButtonProps {
  campaign: {
    id: string
    goalAmount: number
    duration: number
  }
}

export function DeployCampaignButton({ campaign }: DeployCampaignButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient()

  const { writeContract, data: createHash, isPending: isCreatePending, error: createError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  const escrowAddress = chainId ? getContractAddress(chainId, "ESCROW_VAULT") : undefined

  const { data: usdcAddress } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "usdcToken",
    query: { enabled: !!escrowAddress },
  })

  const { data: platformWallet } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "platformWallet",
    query: { enabled: !!escrowAddress },
  })

  const { data: nextCampaignId } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "nextCampaignId",
    query: { enabled: !!escrowAddress },
  })

  const handleDeploy = async () => {
    if (!address) {
      toast.error("Please connect your wallet")
      return
    }

    if (!publicClient || !escrowAddress) {
      toast.error("Contract not available")
      return
    }

    console.log("[v0] ===== STARTING DEPLOYMENT =====")

    const goalInWei = parseUnits(campaign.goalAmount.toString(), 6)
    const durationDays = BigInt(campaign.duration)
    const feeInBasisPoints = BigInt(500)

    console.log("[v0] Transaction parameters:", {
      goalInWei: goalInWei.toString(),
      durationDays: durationDays.toString(),
      feeInBasisPoints: feeInBasisPoints.toString(),
    })

    try {
      console.log("[v0] Step 1: Simulating transaction...")

      const { result } = await publicClient.simulateContract({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, durationDays, feeInBasisPoints],
        account: address,
      })

      console.log("[v0] ✓ Simulation successful!")
      console.log("[v0] Expected campaign ID:", result.toString())

      console.log("[v0] Step 2: Estimating gas...")

      const estimatedGas = await publicClient.estimateContractGas({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, durationDays, feeInBasisPoints],
        account: address,
      })

      console.log("[v0] ✓ Gas estimated:", estimatedGas.toString())

      const gasLimit = (estimatedGas * 150n) / 100n

      console.log("[v0] Step 3: Executing transaction with gas limit:", gasLimit.toString())

      setIsDeploying(true)

      writeContract({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, durationDays, feeInBasisPoints],
        gas: gasLimit,
      })

      console.log("[v0] ✓ Transaction initiated")
    } catch (error: any) {
      console.error("[v0] ✗ Deployment failed:", error)
      setIsDeploying(false)

      if (error.message) {
        console.error("[v0] Error details:", error.message)

        if (error.message.includes("User rejected") || error.message.includes("user rejected")) {
          toast.error("Transaction rejected by user")
        } else if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees")
        } else if (error.message.includes("execution reverted")) {
          toast.error("Contract rejected the transaction. Please check the parameters.")
        } else {
          toast.error(`Deployment failed: ${error.message.substring(0, 100)}`)
        }
      } else {
        toast.error("Failed to deploy campaign")
      }
    }
  }

  const extractCampaignIdFromReceipt = async (txHash: `0x${string}`): Promise<number | null> => {
    if (!publicClient) return null

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: CAMPAIGN_ESCROW_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === "CampaignCreated") {
            return Number(decoded.args.campaignId)
          }
        } catch {
          continue
        }
      }

      return null
    } catch (error) {
      console.error("[v0] Failed to extract campaign ID:", error)
      return null
    }
  }

  useEffect(() => {
    if (createError) {
      console.error("[v0] Transaction error:", createError)
      setIsDeploying(false)

      if (createError.message.includes("User rejected") || createError.message.includes("user rejected")) {
        toast.error("Transaction rejected by user")
      } else {
        toast.error("Transaction failed: " + createError.message)
      }
    }
  }, [createError])

  useEffect(() => {
    if (createHash && isDeploying) {
      console.log("[v0] Transaction hash received:", createHash)
      toast.loading("Transaction submitted. Waiting for confirmation...", { id: "deploy-tx" })
    }
  }, [createHash, isDeploying])

  useEffect(() => {
    if (isConfirmed && createHash) {
      ;(async () => {
        try {
          console.log("[v0] Transaction confirmed:", createHash)
          toast.dismiss("deploy-tx")

          const blockchainCampaignId = await extractCampaignIdFromReceipt(createHash)

          if (blockchainCampaignId === null) {
            throw new Error("Failed to extract campaign ID from transaction")
          }

          console.log("[v0] Blockchain campaign ID:", blockchainCampaignId)

          const response = await fetch("/api/campaigns/deploy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId: campaign.id,
              blockchainCampaignId,
              txHash: createHash,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to update campaign in database")
          }

          toast.success("Campaign deployed successfully!")

          setTimeout(() => window.location.reload(), 1000)
        } catch (error) {
          console.error("[v0] Post-deployment failed:", error)
          toast.error(error instanceof Error ? error.message : "Failed to complete deployment")
          setIsDeploying(false)
        }
      })()
    }
  }, [isConfirmed, createHash, campaign.id])

  const isLoading = isDeploying || isCreatePending || isConfirming

  return (
    <Button onClick={handleDeploy} disabled={isLoading} className="w-full">
      {isLoading ? "Deploying to Blockchain..." : "🚀 Deploy to Blockchain"}
    </Button>
  )
}
