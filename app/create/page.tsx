"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RichEditor } from "@/components/ui/rich-editor"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { format } from "date-fns"
import Link from "next/link"
import dynamic from "next/dynamic"
import { MediaUpload } from "@/components/ui/media-upload"
import { Save, ImageIcon, Target, Users, DollarSign, Plus, Trash2, ArrowLeft, CalendarIcon } from "lucide-react"

import { useTierScrollGuard } from "@/components/hooks/useTierScrollGuard"
import { usdToUsdc } from "@/lib/utils/money" // Import usdToUsdc

const WalletConnectButton = dynamic(() => import("@/components/wallet-connect-button"), {
  ssr: false,
  loading: () => <Button disabled>Loading...</Button>,
})

interface CampaignData {
  basic: {
    title: string
    subtitle: string
    description: string
    category: string
    tags: string[]
    socialLinks: {
      website: string
      x: string
      instagram: string
      youtube: string
      tiktok: string
    }
  }
  media: {
    mainImage: File | null
    mainImageUrl: string // Added to store image URL
    gallery: File[]
    galleryUrls: string[] // Added to store gallery URLs
    video: File | null
    youtubeUrl: string
  }
  funding: {
    goal: number
    endDate: Date | undefined
    currency: string
    minPledge: number
  }
  rewards: RewardTier[]
  launch: {
    launchDate: string
    prelaunch: boolean
    notifications: boolean
  }
  milestones?: Milestone[] // Added milestones to CampaignData interface
}

interface RewardTier {
  id: string
  title: string
  description: string
  amount: number
  deliveryDate: Date | undefined
  quantity: number | null
  isLimited: boolean
  items: string[]
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate: Date | undefined
  isCompleted: boolean
}

const initialCampaignData: CampaignData = {
  basic: {
    title: "",
    subtitle: "",
    description: "",
    category: "",
    tags: [],
    socialLinks: {
      website: "",
      x: "",
      instagram: "",
      youtube: "",
      tiktok: "",
    },
  },
  media: {
    mainImage: null,
    mainImageUrl: "", // Initialize mainImageUrl
    gallery: [],
    galleryUrls: [], // Initialize galleryUrls
    video: null,
    youtubeUrl: "",
  },
  funding: {
    goal: 0,
    endDate: undefined,
    currency: "USD",
    minPledge: 0,
  },
  rewards: [],
  launch: {
    launchDate: "",
    prelaunch: false,
    notifications: true,
  },
  milestones: [], // Initialize milestones
}

const categories = [
  "Technology",
  "Design",
  "Games",
  "Film & Video",
  "Music",
  "Art",
  "Fashion",
  "Food",
  "Publishing",
  "Crafts",
  "Other",
]

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState<CampaignData>(initialCampaignData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const tierRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const setTierRef = (id: string) => (el: HTMLDivElement | null) => {
    tierRefs.current[id] = el
  }
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const tiersContainerRef = useRef<HTMLDivElement>(null)
  useTierScrollGuard(tiersContainerRef, [campaignData.rewards])

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      if (!el) return false
      const node = el as HTMLElement
      return !!node.closest('input, textarea, [contenteditable="true"]')
    }

    const onKey = (e: KeyboardEvent) => {
      // If user is typing in an input field, don't trigger shortcuts
      if (isTyping(e.target)) return

      // Prevent number keys from switching tabs
      if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener("keydown", onKey, true) // Use capture phase
    return () => window.removeEventListener("keydown", onKey, true)
  }, [])

  useEffect(() => {
    const onHash = () => console.log("[debug] hashchange:", location.hash)
    const onPop = () => console.log("[debug] popstate")

    window.addEventListener("hashchange", onHash)
    window.addEventListener("popstate", onPop)

    return () => {
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("popstate", onPop)
    }
  }, [])

  useEffect(() => {
    if (!lastAddedId) return
    const el = tierRefs.current[lastAddedId]
    // Wait 2 frames for DOM to be fully rendered (StrictMode/re-render protection)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
        el?.querySelector<HTMLInputElement>('input[name="tier-title"]')?.focus({ preventScroll: true })
        setLastAddedId(null)
      })
    })
  }, [lastAddedId])

  const RewardTierCard = ({
    tier,
    onUpdate,
    onDelete,
  }: {
    tier: RewardTier
    onUpdate: (tier: RewardTier) => void
    onDelete: () => void
  }) => {
    const [localTitle, setLocalTitle] = useState(tier.title)
    const [localAmount, setLocalAmount] = useState(tier.amount)
    const [localDescription, setLocalDescription] = useState(tier.description)
    const [isDeliveryDateOpen, setIsDeliveryDateOpen] = useState(false)

    const handleTitleBlur = () => {
      if (localTitle !== tier.title) {
        onUpdate({ ...tier, title: localTitle })
      }
    }

    const handleAmountBlur = () => {
      if (localAmount !== tier.amount) {
        onUpdate({ ...tier, amount: localAmount })
      }
    }

    const handleDescriptionBlur = () => {
      if (localDescription !== tier.description) {
        onUpdate({ ...tier, description: localDescription })
      }
    }

    return (
      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Reward Tier</CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete} type="button">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                name="tier-title"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Early Bird Special"
                className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (USDC) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={localAmount === 0 ? "" : localAmount}
                  onChange={(e) => setLocalAmount(Number(e.target.value))}
                  onBlur={handleAmountBlur}
                  placeholder="25"
                  className="pl-10 border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <RichEditor
              content={localDescription}
              onChange={setLocalDescription}
              onBlur={handleDescriptionBlur}
              placeholder="What backers will receive for this pledge amount. Use formatting to highlight key benefits and features."
              className="min-h-[120px] border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Delivery</Label>
              <Popover open={isDeliveryDateOpen} onOpenChange={setIsDeliveryDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-zinc-800 border-2 border-border hover:bg-background"
                  >
                    <span className="mr-2">📅</span>
                    {tier.deliveryDate ? format(tier.deliveryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tier.deliveryDate}
                    onSelect={(date) => {
                      onUpdate({ ...tier, deliveryDate: date })
                      if (date) {
                        setIsDeliveryDateOpen(false)
                      }
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Limited Quantity</Label>
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border bg-zinc-800/50 hover:bg-zinc-800/70 transition-colors">
                <Switch
                  checked={tier.isLimited}
                  onCheckedChange={(checked) => onUpdate({ ...tier, isLimited: checked })}
                  className="data-[state=checked]:bg-primary scale-125"
                />
                <Label className="cursor-pointer flex-1 text-sm font-medium">
                  {tier.isLimited ? "✓ Limited quantity enabled" : "Enable limited quantity"}
                </Label>
              </div>
              {tier.isLimited && (
                <Input
                  type="number"
                  name="tier-quantity"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tier.quantity ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value)
                    onUpdate({ ...tier, quantity: Number.isFinite(v) ? v : null })
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="100"
                  className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const MilestoneCard = ({
    milestone,
    index,
    onUpdate,
    onDelete,
  }: {
    milestone: Milestone
    index: number
    onUpdate: (milestone: Milestone) => void
    onDelete: () => void
  }) => {
    const [localTitle, setLocalTitle] = useState(milestone.title)
    const [localDescription, setLocalDescription] = useState(milestone.description)
    const [isTargetDateOpen, setIsTargetDateOpen] = useState(false)

    const handleTitleBlur = () => {
      if (localTitle !== milestone.title) {
        onUpdate({ ...milestone, title: localTitle })
      }
    }

    const handleDescriptionBlur = () => {
      if (localDescription !== milestone.description) {
        onUpdate({ ...milestone, description: localDescription })
      }
    }

    const handleDateSelect = (date: Date | undefined) => {
      onUpdate({ ...milestone, targetDate: date })
      if (date) {
        setIsTargetDateOpen(false)
      }
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Milestone {index + 1}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete} type="button">
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Milestone Title *</Label>
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Prototype Completion"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Describe what this milestone entails and its importance."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Date</Label>
            <Popover open={isTargetDateOpen} onOpenChange={setIsTargetDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {milestone.targetDate ? format(milestone.targetDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={milestone.targetDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    )
  }

  const addRewardTier = () => {
    const newTier: RewardTier = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      amount: 0,
      deliveryDate: undefined,
      quantity: null,
      isLimited: false,
      items: [],
    }
    setCampaignData((prev) => ({
      ...prev,
      rewards: [...prev.rewards, newTier],
    }))

    setLastAddedId(newTier.id)
  }

  const updateRewardTier = (index: number, updatedTier: RewardTier) => {
    setCampaignData((prev) => ({
      ...prev,
      rewards: prev.rewards.map((tier, i) => (i === index ? updatedTier : tier)),
    }))
  }

  const deleteRewardTier = (index: number) => {
    setCampaignData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }))
  }

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: "",
      description: "",
      targetDate: undefined,
      isCompleted: false,
    }
    setCampaignData((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone],
    }))
  }

  const updateMilestone = (index: number, updatedMilestone: Milestone) => {
    setCampaignData((prev) => ({
      ...prev,
      milestones: prev.milestones?.map((m, i) => (i === index ? updatedMilestone : m)),
    }))
  }

  const deleteMilestone = (index: number) => {
    setCampaignData((prev) => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!campaignData.basic.title) newErrors.title = "Campaign title is required"
      if (!campaignData.basic.subtitle) newErrors.subtitle = "Subtitle is required"
      if (!campaignData.basic.description) newErrors.description = "Description is required"
      if (!campaignData.basic.category) newErrors.category = "Category is required"
    }

    if (step === 2) {
      if (!campaignData.media.mainImage) newErrors.mainImage = "Main campaign image is required"
    }

    if (step === 3) {
      if (!campaignData.funding.goal || campaignData.funding.goal <= 0) {
        newErrors.goal = "Funding goal must be greater than 0"
      }
      if (!campaignData.funding.endDate) {
        newErrors.endDate = "Campaign end date is required"
      }
    }

    if (step === 4) {
      if (campaignData.rewards.length === 0) {
        newErrors.rewards = "At least one reward tier is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    const allErrors: Record<string, string> = {}

    if (!campaignData.basic.title) allErrors.title = "Required: Please enter a campaign title"
    if (!campaignData.basic.subtitle) allErrors.subtitle = "Required: Please enter a subtitle"
    if (!campaignData.basic.description) allErrors.description = "Required: Please enter a description"
    if (!campaignData.basic.category) allErrors.category = "Required: Please select a category"
    if (!campaignData.media.mainImage && !campaignData.media.mainImageUrl)
      allErrors.mainImage = "Required: Please upload a main image"
    if (!campaignData.funding.goal || campaignData.funding.goal <= 0) {
      allErrors.goal = "Required: Please enter a funding goal (greater than 0)"
    }
    if (!campaignData.funding.endDate) {
      allErrors.endDate = "Required: Please select a campaign end date"
    }
    if (campaignData.rewards.length === 0) {
      allErrors.rewards = "Required: Please create at least one reward tier"
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      // If there are errors, activate the corresponding tab
      if (allErrors.title || allErrors.subtitle || allErrors.description || allErrors.category) setActiveTab("basic")
      else if (allErrors.mainImage) setActiveTab("media")
      else if (allErrors.goal || allErrors.endDate) setActiveTab("funding")
      else if (allErrors.rewards) setActiveTab("tiers")
      return
    }

    if (!isConnected || !address) {
      setErrors({
        wallet:
          "Wallet connection required. Please connect your wallet using the 'Connect Wallet' button in the header.",
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()

      const duration = campaignData.funding.endDate
        ? Math.ceil((campaignData.funding.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30

      const minPledgeUsd = Number(campaignData.funding.minPledge) || 1
      const minContributionUsdc = usdToUsdc(minPledgeUsd)

      formData.append(
        "data",
        JSON.stringify({
          basic: campaignData.basic,
          media: {
            youtubeUrl: campaignData.media.youtubeUrl,
          },
          funding: {
            ...campaignData.funding,
            duration,
            minContributionUsdc, // Add minContributionUsdc to payload
          },
          rewards: campaignData.rewards.map((reward) => ({
            ...reward,
            deliveryDate: reward.deliveryDate ? reward.deliveryDate.toISOString() : "",
          })),
          milestones: campaignData.milestones?.map((milestone) => ({
            ...milestone,
            targetDate: milestone.targetDate ? milestone.targetDate.toISOString() : "",
          })), // Include milestones in JSON data
          creatorAddress: address,
        }),
      )

      if (campaignData.media.mainImage) {
        formData.append("coverImage", campaignData.media.mainImage)
      }

      if (campaignData.media.gallery && campaignData.media.gallery.length > 0) {
        campaignData.media.gallery.forEach((file) => {
          formData.append("gallery", file)
        })
      }

      // The original code block had a `video` upload here. It's being removed as per the update.
      // if (campaignData.media.video) {
      //   formData.append("video", campaignData.media.video)
      // }

      console.log("[v0] Creating campaign with media files:", {
        hasCoverImage: !!campaignData.media.mainImage,
        galleryCount: campaignData.media.gallery?.length || 0,
        // hasVideo: !!campaignData.media.video, // This will now be false
        hasYoutubeUrl: !!campaignData.media.youtubeUrl, // Added check for YouTube URL
      })

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Server returned non-JSON response. Status:", response.status)

        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(
            "Vercel is experiencing infrastructure issues. Please try again in a few minutes. Check https://vercel-status.com for updates.",
          )
        }

        throw new Error("Server returned an unexpected response. Please try again.")
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save campaign")
      }

      const result = await response.json()
      console.log("[v0] Campaign created successfully:", result)

      router.push(`/dashboard?newCampaign=${result.campaignId}`, { scroll: false })
    } catch (error) {
      console.error("[v0] Campaign creation failed:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Failed to create campaign" })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleMainImageChange = useCallback((files: File[]) => {
    setCampaignData((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        mainImage: files[0] || null,
        mainImageUrl: files[0] ? URL.createObjectURL(files[0]) : prev.media.mainImageUrl, // Store URL
      },
    }))
  }, [])

  const handleGalleryChange = useCallback((files: File[]) => {
    console.log("[v0] Gallery files changed:", files.length)
    setCampaignData((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        gallery: [...prev.media.gallery, ...files], // Append new files to existing gallery
        galleryUrls: [...prev.media.galleryUrls, ...files.map((f) => URL.createObjectURL(f))],
      },
    }))
  }, [])

  // The original code block had handleVideoChange. It's being removed as per the update.
  // const handleVideoChange = useCallback((files: File[]) => {
  //   setCampaignData((prev) => ({
  //     ...prev,
  //     media: { ...prev.media, video: files[0] || null },
  //   }))
  // }, [])

  const handleMediaError = useCallback((error: string) => {
    setErrors((prev) => ({ ...prev, media: error }))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-4xl">🚀</span>
                <h1 className="text-3xl font-bold">Create Your Campaign</h1>
              </div>
              <p className="text-muted-foreground">
                Launch your project and bring your ideas to life with the support of our community.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {!isConnected && (
            <Alert className="border-2 border-yellow-500/50 bg-yellow-500/10">
              <div className="flex items-center gap-3 col-span-2">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-lg mb-2 text-yellow-600 dark:text-yellow-400">
                    Wallet Connection Required
                  </p>
                  <p className="text-sm mb-2">
                    To create your campaign, you need to connect your wallet. This allows you to deploy your campaign to
                    the blockchain and receive funds.
                  </p>
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                    👉 Please click the "Connect Wallet" button in the header to connect your wallet
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {errors.wallet && (
            <Alert className="border-2 border-destructive bg-destructive/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">❌</span>
                <p className="text-sm font-semibold text-destructive">{errors.wallet}</p>
              </div>
            </Alert>
          )}

          {isConnected && address && (
            <Alert className="border-2 border-green-500/50 bg-green-500/10">
              <div className="flex items-center gap-3 col-span-2">
                <span className="text-2xl flex-shrink-0">✅</span>
                <div className="flex-1">
                  <p className="font-semibold mb-1 text-green-600 dark:text-green-400">Wallet Connected</p>
                  <p className="text-sm font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {errors.submit && (
            <Alert className="border-2 border-destructive bg-destructive/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">❌</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">{errors.submit}</p>
                  {errors.submit.includes("Vercel") && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This appears to be a temporary Vercel infrastructure issue. Your campaign data is safe. Please
                      wait a few minutes and try again.
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-primary/20">
                  <TabsTrigger
                    value="basic"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/40"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/40"
                  >
                    Media
                  </TabsTrigger>
                  <TabsTrigger
                    value="funding"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/40"
                  >
                    Funding
                  </TabsTrigger>
                  <TabsTrigger
                    value="tiers"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/40"
                  >
                    Reward Tiers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">📄</span>
                        Campaign Details
                      </CardTitle>
                      <CardDescription>Tell us about your project</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Campaign Title *</Label>
                        <Input
                          id="title"
                          value={campaignData.basic.title}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              basic: { ...prev.basic, title: e.target.value },
                            }))
                          }
                          placeholder="Revolutionary VR Headset for Everyone"
                          className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                        />
                        {errors.title && <p className="text-sm font-semibold text-destructive">{errors.title}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtitle *</Label>
                        <Input
                          id="subtitle"
                          value={campaignData.basic.subtitle}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              basic: { ...prev.basic, subtitle: e.target.value },
                            }))
                          }
                          placeholder="Immersive virtual reality at an affordable price"
                          className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                        />
                        {errors.subtitle && <p className="text-sm font-semibold text-destructive">{errors.subtitle}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Campaign Description *</Label>
                        <RichEditor
                          content={campaignData.basic.description}
                          onChange={(content) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              basic: { ...prev.basic, description: content },
                            }))
                          }
                          placeholder="Tell your story. What makes your project special? What problem does it solve? Use rich formatting to make your description engaging and professional."
                          className="border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
                        />
                        {errors.description && (
                          <p className="text-sm font-semibold text-destructive">{errors.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={campaignData.basic.category}
                            onValueChange={(value) =>
                              setCampaignData((prev) => ({
                                ...prev,
                                basic: { ...prev.basic, category: value },
                              }))
                            }
                          >
                            <SelectTrigger className="border-2 border-border bg-zinc-800">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category.toLowerCase()}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.category && (
                            <p className="text-sm font-semibold text-destructive">{errors.category}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={campaignData.basic.tags.join(", ")}
                            onChange={(e) => {
                              const value = e.target.value
                              setCampaignData((prev) => ({
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  tags: value ? [value] : [],
                                },
                              }))
                            }}
                            onBlur={(e) => {
                              const value = e.target.value
                              const tags = value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean)
                              setCampaignData((prev) => ({
                                ...prev,
                                basic: { ...prev.basic, tags },
                              }))
                            }}
                            placeholder="VR, Gaming, Technology"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Separate tags with commas (e.g., VR, Gaming, Technology)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Campaign Media
                      </CardTitle>
                      <CardDescription>Upload images and add video to showcase your campaign</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <Alert>
                        <div className="flex items-center gap-3 col-span-2">
                          <span className="text-lg flex-shrink-0">ℹ️</span>
                          <p className="text-sm flex-1">
                            High-quality images and videos significantly increase campaign success rates. Make sure your
                            media clearly shows your product or project.
                          </p>
                        </div>
                      </Alert>

                      <MediaUpload
                        type="image"
                        title="Main Campaign Image *"
                        description="This will be the primary image shown on your campaign page"
                        maxSize={10 * 1024 * 1024}
                        enableCompression={true}
                        showPreview={true}
                        initialFiles={campaignData.media.mainImageUrl ? [campaignData.media.mainImageUrl] : []} // Pass initialFiles
                        onFilesChange={handleMainImageChange}
                        onError={handleMediaError}
                      />
                      {errors.mainImage && !campaignData.media.mainImage && !campaignData.media.mainImageUrl && (
                        <p className="text-sm font-semibold text-destructive">{errors.mainImage}</p>
                      )}

                      <Separator />

                      <MediaUpload
                        type="image"
                        title="Gallery Images"
                        description="Additional images to showcase your project (optional)"
                        multiple={true}
                        maxFiles={8}
                        maxSize={10 * 1024 * 1024}
                        enableCompression={true}
                        showPreview={true}
                        initialFiles={campaignData.media.galleryUrls} // Pass initialFiles
                        onFilesChange={handleGalleryChange}
                        onError={handleMediaError}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="youtubeUrl" className="text-base font-semibold">
                            Campaign Video (YouTube)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Add a YouTube video to showcase your campaign. Videos can significantly boost engagement!
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="youtubeUrl">YouTube URL</Label>
                          <Input
                            id="youtubeUrl"
                            type="url"
                            value={campaignData.media.youtubeUrl}
                            onChange={(e) =>
                              setCampaignData((prev) => ({
                                ...prev,
                                media: { ...prev.media, youtubeUrl: e.target.value },
                              }))
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste your YouTube video URL. Supports youtube.com/watch, youtu.be, and youtube.com/embed/
                            links.
                          </p>
                        </div>

                        {campaignData.media.youtubeUrl && (
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <iframe
                              src={(() => {
                                const url = campaignData.media.youtubeUrl
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
                                return ""
                              })()}
                              title="Campaign video preview"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="funding" className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Funding Goals
                      </CardTitle>
                      <CardDescription>Set your funding target and timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="goal">Funding Goal (USDC) *</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="goal"
                              type="number"
                              value={campaignData.funding.goal === 0 ? "" : campaignData.funding.goal}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : Number(e.target.value)
                                setCampaignData((prev) => ({
                                  ...prev,
                                  funding: { ...prev.funding, goal: value },
                                }))
                              }}
                              placeholder="50000"
                              className="pl-10 border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                            />
                          </div>
                          {errors.goal && <p className="text-sm font-semibold text-destructive">{errors.goal}</p>}
                          <p className="text-xs text-muted-foreground">
                            Set a realistic goal based on your project needs
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">Campaign End Date *</Label>
                          <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-2 bg-zinc-800 hover:bg-background"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {campaignData.funding.endDate ? (
                                  format(campaignData.funding.endDate, "PPP")
                                ) : (
                                  <span className="text-muted-foreground">Pick an end date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={campaignData.funding.endDate}
                                onSelect={(date) => {
                                  setCampaignData((prev) => ({
                                    ...prev,
                                    funding: { ...prev.funding, endDate: date },
                                  }))
                                  if (date) {
                                    setIsEndDateOpen(false)
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          {errors.endDate && <p className="text-sm font-semibold text-destructive">{errors.endDate}</p>}
                          <p className="text-xs text-muted-foreground">
                            Campaign will end at 23:59:59 UTC on the selected day. Most successful campaigns run for
                            30-60 days.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minPledge">Minimum Pledge (USDC)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="minPledge"
                              type="number"
                              value={campaignData.funding.minPledge === 0 ? "" : campaignData.funding.minPledge}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : Number(e.target.value)
                                setCampaignData((prev) => ({
                                  ...prev,
                                  funding: { ...prev.funding, minPledge: value },
                                }))
                              }}
                              placeholder="1"
                              className="pl-10 border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Minimum amount backers can pledge</p>
                        </div>

                        {/* Currency selection removed - USDC only */}
                      </div>

                      <Alert>
                        <div className="flex items-center gap-3 col-span-2">
                          <span className="text-lg flex-shrink-0">⚠️</span>
                          <p className="text-sm flex-1">
                            Remember: This is an all-or-nothing funding model. You only receive funds if you reach your
                            goal by the deadline.
                          </p>
                        </div>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tiers" className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Reward Tiers
                          </CardTitle>
                          <CardDescription>Create reward tiers for your backers</CardDescription>
                        </div>
                        <Button onClick={addRewardTier} type="button" className="bg-primary hover:bg-primary/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Tier
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {errors.rewards && (
                        <Alert className="border-2 border-destructive bg-destructive/10">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl flex-shrink-0">⚠️</span>
                            <p className="text-sm font-semibold text-destructive">{errors.rewards}</p>
                          </div>
                        </Alert>
                      )}

                      <div ref={tiersContainerRef} className="tiers-editor space-y-6">
                        {campaignData.rewards.map((tier, index) => (
                          <div key={tier.id} ref={setTierRef(tier.id)}>
                            <div className="mb-2 text-sm text-muted-foreground">Reward Tier {index + 1}</div>
                            <RewardTierCard
                              tier={tier}
                              onUpdate={(updatedTier) => updateRewardTier(index, updatedTier)}
                              onDelete={() => deleteRewardTier(index)}
                            />
                          </div>
                        ))}

                        {campaignData.rewards.length === 0 && (
                          <Card className="border-dashed border-2">
                            <CardContent className="pt-6 text-center">
                              <span className="text-6xl mb-4 block">🎁</span>
                              <h3 className="text-lg font-semibold mb-2">No reward tiers yet</h3>
                              <p className="text-muted-foreground mb-4">
                                Create reward tiers to incentivize backers and offer value for their support.
                              </p>
                              <Button onClick={addRewardTier} type="button" className="bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Tier
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" asChild type="button">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isConnected}
                  className={!isConnected ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {loading ? "Creating Campaign..." : !isConnected ? "Connect Wallet to Create" : "Create Campaign"}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Campaign Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Info</span>
                      <span
                        className={
                          campaignData.basic.title && campaignData.basic.description
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }
                      >
                        {campaignData.basic.title && campaignData.basic.description ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Media</span>
                      <span className={campaignData.media.mainImage ? "text-green-500" : "text-muted-foreground"}>
                        {campaignData.media.mainImage ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Funding</span>
                      <span
                        className={
                          campaignData.funding.goal > 0 && campaignData.funding.endDate
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }
                      >
                        {campaignData.funding.goal > 0 && campaignData.funding.endDate ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reward Tiers</span>
                      <span className={campaignData.rewards.length > 0 ? "text-green-500" : "text-muted-foreground"}>
                        {campaignData.rewards.length > 0 ? "✓" : "○"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <div className="flex items-center gap-3 col-span-2">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm flex-1">
                    <strong>Tip:</strong> Complete all required sections before creating your campaign. You can always
                    edit it later from your dashboard.
                  </p>
                </div>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
