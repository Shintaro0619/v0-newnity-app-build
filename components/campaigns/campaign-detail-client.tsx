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
import {
  getCampaignById,
  savePledgeToDatabase,
  updateCampaignBlockchainData,
  getCampaignTiers,
} from "@/lib/actions/campaigns"
import { formatDeadline, isDeadlinePassed } from "@/lib/utils/date-utils"
import { toast } from "react-toastify"
import { formatCurrency } from "@/lib/utils"

interface CampaignDetailClientProps {
  campaign: any
}

export function CampaignDetailClient({ campaign: initialCampaign }: CampaignDetailClientProps) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [showPledgeModal, setShowPledgeModal] = useState(false)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const [tiers, setTiers] = useState<any[]>([])
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
          blockchain_campaign_id: updatedCampaign.blockchainCampaignId,
        })
      }

      const campaignTiers = await getCampaignTiers(campaign.id)
      setTiers(campaignTiers)
      console.log("[v0] Reward tiers loaded:", campaignTiers.length)
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

  useEffect(() => {
    const loadTiers = async () => {
      try {
        const campaignTiers = await getCampaignTiers(campaign.id)
        setTiers(campaignTiers)
        console.log("[v0] Reward tiers loaded:", campaignTiers.length)
      } catch (error) {
        console.error("[v0] Failed to load reward tiers:", error)
      }
    }
    loadTiers()
  }, [campaign.id])

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Content (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
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

            {/* Main Cover Image */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={campaign.cover_image || "/placeholder.svg?height=400&width=600"}
                alt="Campaign preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Campaign Video */}
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
              <Card className="w-full">
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

            {/* About This Project */}
            <Card>
              <CardHeader>
                <CardTitle>About This Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="prose prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ul:list-disc prose-ul:list-outside prose-ul:pl-6 prose-ol:text-foreground prose-ol:list-decimal prose-ol:list-outside prose-ol:pl-6 prose-li:text-foreground prose-li:ml-4 prose-blockquote:text-muted-foreground max-w-none"
                  dangerouslySetInnerHTML={{ __html: campaign.story || campaign.description }}
                />
              </CardContent>
            </Card>

            {/* About the Creator */}
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

            {/* Social Links Section */}
            {campaign.social_links && Object.values(campaign.social_links).some((link) => link) && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect with this Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {campaign.social_links.website && (
                      <a
                        href={campaign.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                        <span className="text-sm font-medium">Website</span>
                      </a>
                    )}
                    {campaign.social_links.x && (
                      <a
                        href={campaign.social_links.x}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-sm font-medium">X (Twitter)</span>
                      </a>
                    )}
                    {campaign.social_links.instagram && (
                      <a
                        href={campaign.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    {campaign.social_links.youtube && (
                      <a
                        href={campaign.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        <span className="text-sm font-medium">YouTube</span>
                      </a>
                    )}
                    {campaign.social_links.tiktok && (
                      <a
                        href={campaign.social_links.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                        <span className="text-sm font-medium">TikTok</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Funding Progress Card */}
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

                {/* Action Buttons */}
                {blockchainId && campaign.status === "ACTIVE" ? (
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
                        disabled={hasDeadlinePassed}
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

                {/* Success/Failed Messages */}
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

            {tiers.length > 0 && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Reward Tiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="p-4 border-2 border-zinc-700 rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{tier.title}</h4>
                        <span className="text-xl font-bold text-primary">${formatCurrency(Number(tier.amount))}</span>
                      </div>
                      <div
                        className="text-sm text-muted-foreground mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: tier.description }}
                      />
                      {tier.delivery_date && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>📅</span>
                          <span>Estimated delivery: {new Date(tier.delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {tier.limited_quantity && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>🎯</span>
                          <span>Limited to {tier.max_backers} backers</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
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
