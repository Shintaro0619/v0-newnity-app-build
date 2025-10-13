"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { useAccount } from "wagmi"
import { PledgeModalV2 } from "@/components/pledge-modal-v2"
import { DeployCampaignButton } from "@/components/campaigns/deploy-campaign-button"
import { formatUnits } from "viem"
import { getCampaignById } from "@/lib/actions/campaigns"

interface CampaignDetailClientProps {
  campaign: any
}

export function CampaignDetailClient({ campaign: initialCampaign }: CampaignDetailClientProps) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [showPledgeModal, setShowPledgeModal] = useState(false)

  const { address } = useAccount()

  const creatorWalletAddress = campaign.creator?.walletAddress

  const blockchainId = campaign.blockchainCampaignId
  const contractHook = useCampaignContract(blockchainId ?? undefined)
  const { campaignData, handleFinalize, handleRefund, isFinalizePending, isRefundPending } = contractHook

  const refreshCampaignData = async () => {
    try {
      console.log("[v0] Refreshing campaign data from database")
      const updatedCampaign = await getCampaignById(campaign.id)
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
        console.log("[v0] Campaign data refreshed:", updatedCampaign)
      }
    } catch (error) {
      console.error("[v0] Failed to refresh campaign data:", error)
    }
  }

  useEffect(() => {
    if (!blockchainId || !campaignData) {
      console.log("[v0] No blockchain campaign ID or data available")
      return
    }

    try {
      const raisedBigInt = campaignData.totalPledged
      const goalBigInt = campaignData.goal
      const deadlineBigInt = campaignData.deadline

      if (!raisedBigInt || !goalBigInt || !deadlineBigInt) {
        return
      }

      const raised = Number(formatUnits(raisedBigInt, 6))
      const goal = Number(formatUnits(goalBigInt, 6))
      const daysLeft = Math.max(0, Math.floor((Number(deadlineBigInt) - Date.now() / 1000) / 86400))

      console.log("[v0] Blockchain data loaded successfully:", {
        raised,
        goal,
        daysLeft,
        finalized: campaignData.finalized,
        successful: campaignData.successful,
      })

      setCampaign((prev: any) => ({
        ...prev,
        raised_amount: raised,
        goal_amount: goal,
        daysLeft,
        status: campaignData.finalized ? (campaignData.successful ? "FUNDED" : "FAILED") : "ACTIVE",
      }))
    } catch (error) {
      console.error("[v0] Failed to load blockchain data:", error)
    }
  }, [campaignData, blockchainId])

  const handleFinalizeClick = async () => {
    if (!blockchainId) {
      console.error("[v0] No blockchain campaign ID")
      return
    }
    try {
      await handleFinalize(blockchainId)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Failed to finalize campaign:", error)
    }
  }

  const handleRefundClick = async () => {
    if (!blockchainId) {
      console.error("[v0] No blockchain campaign ID")
      return
    }
    try {
      await handleRefund(blockchainId)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Failed to refund:", error)
    }
  }

  const handlePledgeClick = () => {
    console.log("[v0] Back This Project button clicked, opening modal")
    setShowPledgeModal(true)
  }

  const handlePledgeSuccess = () => {
    console.log("[v0] Pledge successful, refreshing campaign data")
    refreshCampaignData()
  }

  const progressPercentage = (campaign.raised_amount / campaign.goal_amount) * 100
  const daysLeft =
    campaign.daysLeft ||
    Math.max(0, Math.floor((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const isCreator = address && creatorWalletAddress && address.toLowerCase() === creatorWalletAddress.toLowerCase()

  console.log("[v0] Creator check:", {
    address,
    creatorWalletAddress,
    isCreator,
    blockchainId,
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <span>←</span>
          <span>Back to Campaigns</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{campaign.category}</Badge>
                <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>{campaign.status}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-balance mb-4">{campaign.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <img
                    src={campaign.creator_avatar || "/placeholder.svg"}
                    alt={campaign.creator_name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>by {campaign.creator_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{daysLeft} days left</span>
                </div>
              </div>
            </div>

            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={campaign.cover_image || "/placeholder.svg?height=400&width=600"}
                alt="Campaign preview"
                className="w-full h-full object-cover"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{campaign.story || campaign.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About the Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <img
                    src={campaign.creator_avatar || "/placeholder.svg"}
                    alt={campaign.creator_name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h4 className="font-medium mb-1">{campaign.creator_name}</h4>
                    <p className="text-sm text-muted-foreground">{campaign.creator_bio || "Creator on Newnity"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯</span>
                  Funding Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-primary">${campaign.raised_amount.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">of ${campaign.goal_amount.toLocaleString()}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                    <span>{Math.round(progressPercentage)}% funded</span>
                    <span>{daysLeft} days left</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span className="font-medium">{campaign.backers_count || 0}</span>
                    <span className="text-sm text-muted-foreground">backers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span className="text-sm text-muted-foreground">{daysLeft} days</span>
                  </div>
                </div>

                {blockchainId ? (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white glow-primary"
                    onClick={handlePledgeClick}
                    disabled={campaign.status !== "ACTIVE"}
                  >
                    <span className="mr-2">❤️</span>
                    Back This Project
                  </Button>
                ) : isCreator ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Campaign Not Deployed</p>
                      <p className="text-yellow-800 dark:text-yellow-200">
                        This campaign needs to be deployed to the blockchain before backers can pledge. Deploy it now to
                        start accepting pledges.
                      </p>
                    </div>
                    <DeployCampaignButton
                      campaign={{
                        id: campaign.id,
                        goalAmount: campaign.goal_amount,
                        duration: campaign.duration,
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground text-center">
                    This campaign is not yet deployed on the blockchain. Pledging will be available once the creator
                    deploys it.
                  </div>
                )}

                {isCreator && daysLeft === 0 && campaign.status === "ACTIVE" && blockchainId && (
                  <Button className="w-full mt-2" onClick={handleFinalizeClick} disabled={isFinalizePending}>
                    {isFinalizePending ? "Finalizing..." : "Finalize Campaign"}
                  </Button>
                )}

                {campaign.status === "FAILED" && blockchainId && (
                  <Button
                    className="w-full mt-2 bg-transparent"
                    variant="outline"
                    onClick={handleRefundClick}
                    disabled={isRefundPending}
                  >
                    {isRefundPending ? "Processing Refund..." : "Claim Refund"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {showPledgeModal && blockchainId && (
        <PledgeModalV2
          campaignId={BigInt(blockchainId)}
          campaignTitle={campaign.title}
          onClose={() => setShowPledgeModal(false)}
          onSuccess={handlePledgeSuccess}
        />
      )}
    </div>
  )
}
