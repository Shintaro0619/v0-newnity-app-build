"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { useAccount } from "wagmi"
import { PledgeModalV2 } from "@/components/pledge-modal-v2"
import { DeployCampaignButton } from "@/components/campaigns/deploy-campaign-button"
import { formatUnits } from "viem"
import { getCampaignById, savePledgeToDatabase, updateCampaignBlockchainData } from "@/lib/actions/campaigns"
import { formatDeadline, isDeadlinePassed } from "@/lib/utils/date-utils"
import { toast } from "react-toastify"

interface CampaignDetailClientProps {
  campaign: any
}

export function CampaignDetailClient({ campaign: initialCampaign }: CampaignDetailClientProps) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [showPledgeModal, setShowPledgeModal] = useState(false)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const syncAttempted = useRef(false)
  const [blockchainFunding, setBlockchainFunding] = useState<{
    raised: number
    goal: number
    backers: number
  } | null>(null)

  const { address } = useAccount()
  const router = useRouter()

  const creatorWalletAddress = campaign.creator?.walletAddress

  const blockchainId = campaign.blockchainCampaignId
  const contractHook = useCampaignContract(blockchainId ?? undefined)
  const {
    campaignData,
    handleFinalize,
    handleRefund,
    isFinalizePending,
    isRefundPending,
    hasClaimedRefund,
    userPledgeAmount,
  } = contractHook

  const refreshCampaignData = async () => {
    try {
      console.log("[v0] Refreshing campaign data from database")
      const updatedCampaign = await getCampaignById(campaign.id)
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
        console.log("[v0] Campaign data refreshed:", {
          id: updatedCampaign.id,
          status: updatedCampaign.status,
          raised_amount: updatedCampaign.raised_amount,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to refresh campaign data:", error)
    }
  }

  useEffect(() => {
    if (!blockchainId || !campaignData || syncAttempted.current) {
      console.log("[v0] Skipping blockchain sync:", {
        hasBlockchainId: !!blockchainId,
        hasCampaignData: !!campaignData,
        syncAttempted: syncAttempted.current,
      })
      return
    }

    const syncBlockchainStatus = async () => {
      try {
        console.log("[v0] Starting blockchain data sync")
        console.log("[v0] Blockchain data loaded:", {
          finalized: campaignData.finalized,
          successful: campaignData.successful,
          totalPledged: campaignData.totalPledged?.toString(),
          goal: campaignData.goal?.toString(),
          deadline: campaignData.deadline?.toString(),
          creator: campaignData.creator,
        })

        const raisedBigInt = campaignData.totalPledged
        const goalBigInt = campaignData.goal
        const deadlineBigInt = campaignData.deadline

        if (raisedBigInt === undefined || goalBigInt === undefined || deadlineBigInt === undefined) {
          console.log("[v0] Missing blockchain data (undefined), skipping sync")
          syncAttempted.current = true
          return
        }

        const raised = Number(formatUnits(raisedBigInt, 6))
        const goal = Number(formatUnits(goalBigInt, 6))

        setBlockchainFunding({
          raised,
          goal,
          backers: 0,
        })

        console.log("[v0] Checking if status update is needed:", {
          isFinalized: campaignData.finalized,
          currentStatus: campaign.status,
          shouldUpdate: campaignData.finalized && (campaign.status === "ACTIVE" || campaign.status === "DRAFT"),
        })

        if (campaignData.finalized && (campaign.status === "ACTIVE" || campaign.status === "DRAFT")) {
          const newStatus = campaignData.successful ? "SUCCESSFUL" : "FAILED"
          console.log("[v0] Campaign is finalized on blockchain, updating database status to:", newStatus)

          syncAttempted.current = true

          try {
            const result = await updateCampaignBlockchainData(campaign.id, {
              blockchain_campaign_id: blockchainId,
              status: newStatus,
              raised_amount: raised,
            })

            console.log("[v0] Database status updated successfully:", result)

            await refreshCampaignData()
            console.log("[v0] Campaign data refreshed after status update")
          } catch (updateError) {
            console.error("[v0] Failed to update campaign blockchain data:", updateError)
            syncAttempted.current = false
          }
        } else {
          syncAttempted.current = true
          console.log("[v0] Blockchain data sync completed (no status update needed)")
        }
      } catch (error) {
        console.error("[v0] Failed to sync blockchain status:", error)
        syncAttempted.current = false
      }
    }

    syncBlockchainStatus()
  }, [campaignData, blockchainId, campaign.id])

  const handleFinalizeClick = async () => {
    console.log("[v0] [CLIENT] handleFinalizeClick called")

    if (!blockchainId) {
      console.error("[v0] [CLIENT] No blockchain campaign ID - cannot finalize")
      toast.error("Cannot finalize: Campaign not deployed to blockchain")
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to finalize this campaign? This action cannot be undone. " +
        "If the campaign reached its goal, funds will be released to you. " +
        "If not, backers will be able to claim refunds.",
    )

    if (!confirmed) {
      console.log("[v0] [CLIENT] User cancelled finalization")
      return
    }

    try {
      console.log("[v0] [CLIENT] Calling handleFinalize with campaignId:", blockchainId)
      await handleFinalize(blockchainId)

      console.log("[v0] [CLIENT] handleFinalize completed, refreshing data")
      syncAttempted.current = false
      await refreshCampaignData()
      console.log("[v0] [CLIENT] Campaign data refreshed after finalization")

      setTimeout(async () => {
        console.log("[v0] [CLIENT] Performing delayed refresh")
        syncAttempted.current = false
        await refreshCampaignData()
      }, 2000)
    } catch (error) {
      console.error("[v0] [CLIENT] Failed to finalize campaign:", error)
      toast.error(`Failed to finalize campaign: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleRefundClick = async () => {
    console.log("[v0] [CLIENT] handleRefundClick called")

    if (!blockchainId) {
      console.error("[v0] [CLIENT] No blockchain campaign ID - cannot refund")
      toast.error("Cannot claim refund: Campaign not deployed to blockchain")
      return
    }

    const pledgeAmountInUsdc = Number(userPledgeAmount) / 1e6

    const confirmed = window.confirm(
      `Are you sure you want to claim your refund of $${pledgeAmountInUsdc.toFixed(2)} USDC?`,
    )

    if (!confirmed) {
      console.log("[v0] [CLIENT] User cancelled refund")
      return
    }

    try {
      console.log("[v0] [CLIENT] Calling handleRefund with campaignId:", blockchainId)
      await handleRefund(blockchainId)

      console.log("[v0] [CLIENT] handleRefund completed, refreshing data")
      await refreshCampaignData()
      console.log("[v0] [CLIENT] Campaign data refreshed after refund")
    } catch (error) {
      console.error("[v0] [CLIENT] Failed to refund:", error)
      toast.error(`Failed to claim refund: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handlePledgeClick = () => {
    console.log("[v0] Back This Project button clicked, opening modal")
    setShowPledgeModal(true)
  }

  const handlePledgeSuccess = async (pledgeData: {
    hash: string
    amount: string
    backerAddress: string
    tierId?: string
  }) => {
    console.log("[v0] Pledge successful, saving to database and refreshing campaign data")

    if (campaign.id && pledgeData) {
      try {
        const amountNumber = Number.parseFloat(pledgeData.amount)

        await savePledgeToDatabase({
          campaignId: campaign.id,
          backerWalletAddress: pledgeData.backerAddress,
          amount: amountNumber,
          txHash: pledgeData.hash,
          blockNumber: 0,
          tierId: pledgeData.tierId,
        })

        console.log("[v0] Pledge saved to database successfully")
      } catch (error) {
        console.error("[v0] Failed to save pledge to database:", error)
      }
    }

    syncAttempted.current = false
    await refreshCampaignData()
  }

  const displayRaised = blockchainFunding?.raised ?? (Number(campaign.raised_amount) || 0)
  const displayGoal = blockchainFunding?.goal ?? (Number(campaign.goal_amount) || 0)
  const progressPercentage = displayGoal > 0 ? (displayRaised / displayGoal) * 100 : 0
  const daysLeft =
    campaign.daysLeft ||
    Math.max(0, Math.floor((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const deadlineTimestamp = Math.floor(new Date(campaign.end_date).getTime() / 1000)
  const deadlineInfo = formatDeadline(deadlineTimestamp)
  const hasDeadlinePassed = isDeadlinePassed(deadlineTimestamp)

  const isCreator = address && creatorWalletAddress && address.toLowerCase() === creatorWalletAddress.toLowerCase()

  const isBlockchainFinalized = campaignData?.finalized ?? false

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }

    return null
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(campaign.video_url)
  const hasGallery = campaign.gallery && campaign.gallery.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <span>←</span>
          <span>Back to Campaigns</span>
        </button>

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

            {youtubeEmbedUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Campaign video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {hasGallery && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={campaign.gallery[selectedGalleryIndex] || "/placeholder.svg"}
                      alt={`Gallery image ${selectedGalleryIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {campaign.gallery.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {campaign.gallery.map((imageUrl: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedGalleryIndex(index)}
                          className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-all ${
                            selectedGalleryIndex === index
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/20"
                          }`}
                        >
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Gallery thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: campaign.story || campaign.description }}
                />
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
                    <span className="text-2xl font-bold text-primary">${formatCurrency(displayRaised)}</span>
                    <span className="text-sm text-muted-foreground">of ${formatCurrency(displayGoal)}</span>
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

                <div className="p-3 bg-muted rounded-lg space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline (Local):</span>
                    <span className="font-medium">{deadlineInfo.localDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline (UTC):</span>
                    <span className="font-medium">{deadlineInfo.utcDate} 23:59:59</span>
                  </div>
                </div>

                {blockchainId ? (
                  <>
                    {hasDeadlinePassed && !isBlockchainFinalized ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg text-sm">
                          <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">⏰ Campaign Ended</p>
                          <p className="text-purple-800 dark:text-purple-200">
                            The deadline has been reached.{" "}
                            {isCreator
                              ? "Finalize the campaign to determine if it was successful and release funds or enable refunds."
                              : "Waiting for the creator to finalize the campaign."}
                          </p>
                        </div>
                        <Button className="w-full bg-muted text-muted-foreground cursor-not-allowed" disabled>
                          <span className="mr-2">❤️</span>
                          Back This Project
                        </Button>
                        {isCreator && (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleFinalizeClick}
                            disabled={isFinalizePending}
                          >
                            {isFinalizePending ? "Finalizing..." : "Finalize Campaign"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white glow-primary"
                        onClick={handlePledgeClick}
                        disabled={campaign.status !== "ACTIVE" || hasDeadlinePassed}
                      >
                        <span className="mr-2">❤️</span>
                        Back This Project
                      </Button>
                    )}
                  </>
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

                {isCreator && campaign.status === "SUCCESSFUL" && (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100 mb-1">✅ Campaign Successful!</p>
                      <p className="text-green-800 dark:text-green-200 mb-2">
                        Your campaign reached its goal. Funds have been automatically released to your wallet.
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Total Raised:</span>
                          <span className="font-medium">${formatCurrency(displayRaised)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Platform Fee (5%):</span>
                          <span className="font-medium">-${formatCurrency(displayRaised * 0.05)}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-200 dark:border-green-800 pt-1 mt-1">
                          <span className="text-green-700 dark:text-green-300 font-medium">You Received:</span>
                          <span className="font-bold">${formatCurrency(displayRaised * 0.95)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isCreator && campaign.status === "FAILED" && blockchainId && (
                  <div className="space-y-2">
                    {hasClaimedRefund ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">✅ Refund Claimed</p>
                        <p className="text-green-800 dark:text-green-200">
                          You have successfully claimed your refund of ${(Number(userPledgeAmount) / 1e6).toFixed(2)}{" "}
                          USDC.
                        </p>
                      </div>
                    ) : userPledgeAmount > 0n ? (
                      <>
                        <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                          <p className="font-medium text-orange-900 dark:text-orange-100 mb-1">❌ Campaign Failed</p>
                          <p className="text-orange-800 dark:text-orange-200">
                            This campaign did not reach its goal. You can claim a refund for your pledge of $
                            {(Number(userPledgeAmount) / 1e6).toFixed(2)} USDC.
                          </p>
                        </div>
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={handleRefundClick}
                          disabled={isRefundPending}
                        >
                          {isRefundPending
                            ? "Processing Refund..."
                            : `Claim Refund ($${(Number(userPledgeAmount) / 1e6).toFixed(2)} USDC)`}
                        </Button>
                      </>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm">
                        <p className="text-gray-800 dark:text-gray-200">
                          You did not pledge to this campaign, so there is no refund to claim.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isCreator && campaign.status === "FAILED" && blockchainId && userPledgeAmount > 0n && (
                  <div className="space-y-2">
                    {hasClaimedRefund ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">✅ Refund Claimed</p>
                        <p className="text-green-800 dark:text-green-200">
                          You have successfully claimed your refund of ${(Number(userPledgeAmount) / 1e6).toFixed(2)}{" "}
                          USDC.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                          <p className="font-medium text-orange-900 dark:text-orange-100 mb-1">❌ Campaign Failed</p>
                          <p className="text-orange-800 dark:text-orange-200">
                            This campaign did not reach its goal. You can claim a refund for your pledge of $
                            {(Number(userPledgeAmount) / 1e6).toFixed(2)} USDC.
                          </p>
                        </div>
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={handleRefundClick}
                          disabled={isRefundPending}
                        >
                          {isRefundPending
                            ? "Processing Refund..."
                            : `Claim Refund ($${(Number(userPledgeAmount) / 1e6).toFixed(2)} USDC)`}
                        </Button>
                      </>
                    )}
                  </div>
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
          campaignDbId={campaign.id}
          onClose={() => setShowPledgeModal(false)}
          onSuccess={handlePledgeSuccess}
        />
      )}
    </div>
  )
}
