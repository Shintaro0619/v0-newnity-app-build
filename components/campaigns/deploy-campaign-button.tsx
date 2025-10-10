"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "sonner"

interface DeployCampaignButtonProps {
  campaign: {
    id: string
    goalAmount: number
    duration: number
  }
}

export function DeployCampaignButton({ campaign }: DeployCampaignButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const { address } = useAccount()
  const { handleCreateCampaign, createHash, isCreatePending, createError, extractCampaignIdFromReceipt } =
    useCampaignContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  const handleDeploy = async () => {
    if (!address) {
      toast.error("Please connect your wallet")
      return
    }

    setIsDeploying(true)

    try {
      console.log("[v0] Deploying campaign to blockchain:", {
        goal: campaign.goalAmount,
        duration: campaign.duration,
      })

      await handleCreateCampaign(campaign.goalAmount.toString(), campaign.duration, 500)

      console.log("[v0] Transaction initiated, hash will be available soon...")
    } catch (error) {
      console.error("[v0] Deployment failed:", error)
      setIsDeploying(false)

      if (error instanceof Error) {
        if (error.message.includes("User rejected") || error.message.includes("user rejected")) {
          toast.error("Transaction rejected by user")
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error("Failed to deploy campaign")
      }
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

          // Extract campaign ID from transaction receipt
          const blockchainCampaignId = await extractCampaignIdFromReceipt(createHash)

          if (blockchainCampaignId === null) {
            throw new Error("Failed to extract campaign ID from transaction")
          }

          console.log("[v0] Blockchain campaign ID:", blockchainCampaignId)

          // Update database with blockchain campaign ID
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

          // Reload page to show updated state
          setTimeout(() => window.location.reload(), 1000)
        } catch (error) {
          console.error("[v0] Post-deployment failed:", error)
          toast.error(error instanceof Error ? error.message : "Failed to complete deployment")
          setIsDeploying(false)
        }
      })()
    }
  }, [isConfirmed, createHash, campaign.id, extractCampaignIdFromReceipt])

  const isLoading = isDeploying || isCreatePending || isConfirming

  return (
    <Button onClick={handleDeploy} disabled={isLoading} className="w-full">
      {isLoading ? "Deploying to Blockchain..." : "🚀 Deploy to Blockchain"}
    </Button>
  )
}
