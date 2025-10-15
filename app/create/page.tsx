"use client"

import { useState, useCallback } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import Link from "next/link"
import dynamic from "next/dynamic"
import { MediaUpload } from "@/components/ui/media-upload"
import { Save, ImageIcon, Target, Users, DollarSign, Plus, Trash2, ArrowLeft, CalendarIcon } from "lucide-react"

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
  }
  media: {
    mainImage: File | null
    gallery: File[]
    video: File | null
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
  },
  media: {
    mainImage: null,
    gallery: [],
    video: null,
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

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Reward Tier</CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <span className="text-2xl">🗑️</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Early Bird Special"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={localAmount === 0 ? "" : localAmount}
                  onChange={(e) => setLocalAmount(Number(e.target.value))}
                  onBlur={handleAmountBlur}
                  placeholder="25"
                  className="pl-10"
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
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Delivery</Label>
              <Popover open={isDeliveryDateOpen} onOpenChange={setIsDeliveryDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={tier.isLimited}
                  onCheckedChange={(checked) => onUpdate({ ...tier, isLimited: checked })}
                />
                <Label>Limited Quantity</Label>
              </div>
              {tier.isLimited && (
                <Input
                  type="number"
                  value={tier.quantity || ""}
                  onChange={(e) => onUpdate({ ...tier, quantity: Number(e.target.value) || null })}
                  placeholder="100"
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
          <Button variant="ghost" size="sm" onClick={onDelete}>
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
                  initialFocus
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
      id: Date.now().toString(),
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

    if (!campaignData.basic.title) allErrors.title = "Campaign title is required"
    if (!campaignData.basic.subtitle) allErrors.subtitle = "Subtitle is required"
    if (!campaignData.basic.description) allErrors.description = "Description is required"
    if (!campaignData.basic.category) allErrors.category = "Category is required"
    if (!campaignData.media.mainImage) allErrors.mainImage = "Main campaign image is required"
    if (!campaignData.funding.goal || campaignData.funding.goal <= 0) {
      allErrors.goal = "Funding goal must be greater than 0"
    }
    if (!campaignData.funding.endDate) {
      allErrors.endDate = "Campaign end date is required"
    }
    if (campaignData.rewards.length === 0) {
      allErrors.rewards = "At least one reward tier is required"
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
      setErrors({ wallet: "Please connect your wallet to create the campaign" })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()

      const duration = campaignData.funding.endDate
        ? Math.ceil((campaignData.funding.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30

      formData.append(
        "data",
        JSON.stringify({
          basic: campaignData.basic,
          funding: {
            ...campaignData.funding,
            duration,
          },
          rewards: campaignData.rewards.map((reward) => ({
            ...reward,
            deliveryDate: reward.deliveryDate ? reward.deliveryDate.toISOString() : "",
          })),
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

      if (campaignData.media.video) {
        formData.append("video", campaignData.media.video)
      }

      console.log("[v0] Creating campaign with media files:", {
        hasCoverImage: !!campaignData.media.mainImage,
        galleryCount: campaignData.media.gallery?.length || 0,
        hasVideo: !!campaignData.media.video,
      })

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save campaign")
      }

      const result = await response.json()
      console.log("[v0] Campaign created successfully:", result)

      router.push("/dashboard")
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
      media: { ...prev.media, mainImage: files[0] || null },
    }))
  }, [])

  const handleGalleryChange = useCallback((files: File[]) => {
    setCampaignData((prev) => ({
      ...prev,
      media: { ...prev.media, gallery: files },
    }))
  }, [])

  const handleVideoChange = useCallback((files: File[]) => {
    setCampaignData((prev) => ({
      ...prev,
      media: { ...prev.media, video: files[0] || null },
    }))
  }, [])

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

          {/* Wallet Connection Alert */}
          {!isConnected && (
            <Alert>
              <span className="text-lg">👛</span>
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    <strong>Wallet Connection Required</strong>
                  </p>
                  <p className="text-sm">
                    To create your campaign, you'll need to connect your wallet. This allows you to deploy your campaign
                    to the blockchain and receive funds.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please use the "Connect Wallet" button in the header to connect your wallet.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isConnected && address && (
            <Alert>
              <span className="text-lg">✅</span>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Wallet Connected</strong>
                  </p>
                  <p className="text-sm font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="funding">Funding</TabsTrigger>
                  <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card>
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
                          className={errors.title ? "border-destructive" : ""}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
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
                          className={errors.subtitle ? "border-destructive" : ""}
                        />
                        {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle}</p>}
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
                          className={errors.description ? "border-destructive" : ""}
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
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
                            <SelectTrigger className={errors.category ? "border-destructive" : ""}>
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
                          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={campaignData.basic.tags.join(", ")}
                            onChange={(e) => {
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Campaign Media
                      </CardTitle>
                      <CardDescription>Upload images and videos to showcase your campaign</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <Alert>
                        <span className="text-lg">ℹ️</span>
                        <AlertDescription>
                          High-quality images and videos significantly increase campaign success rates. Make sure your
                          media clearly shows your product or project.
                        </AlertDescription>
                      </Alert>

                      <MediaUpload
                        type="image"
                        title="Main Campaign Image *"
                        description="This will be the primary image shown on your campaign page"
                        maxSize={10 * 1024 * 1024}
                        enableCompression={true}
                        showPreview={true}
                        onFilesChange={handleMainImageChange}
                        onError={handleMediaError}
                      />
                      {errors.mainImage && <p className="text-sm text-destructive">{errors.mainImage}</p>}

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
                        onFilesChange={handleGalleryChange}
                        onError={handleMediaError}
                      />

                      <Separator />

                      <MediaUpload
                        type="video"
                        title="Campaign Video"
                        description="A video pitch can significantly boost your campaign (optional)"
                        maxSize={100 * 1024 * 1024}
                        showPreview={true}
                        onFilesChange={handleVideoChange}
                        onError={handleMediaError}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="funding" className="space-y-6">
                  <Card>
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
                          <Label htmlFor="goal">Funding Goal (USD) *</Label>
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
                              className={`pl-10 ${errors.goal ? "border-destructive" : ""}`}
                            />
                          </div>
                          {errors.goal && <p className="text-sm text-destructive">{errors.goal}</p>}
                          <p className="text-xs text-muted-foreground">
                            Set a realistic goal based on your project needs
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">Campaign End Date *</Label>
                          <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${errors.endDate ? "border-destructive" : ""}`}
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
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                          <p className="text-xs text-muted-foreground">
                            Campaign will end at 23:59:59 UTC on the selected day. Most successful campaigns run for
                            30-60 days.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minPledge">Minimum Pledge (USD)</Label>
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
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Minimum amount backers can pledge</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={campaignData.funding.currency}
                            onValueChange={(value) =>
                              setCampaignData((prev) => ({
                                ...prev,
                                funding: { ...prev.funding, currency: value },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Alert>
                        <span className="text-lg">⚠️</span>
                        <AlertDescription>
                          Remember: This is an all-or-nothing funding model. You only receive funds if you reach your
                          goal by the deadline.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tiers" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Reward Tiers
                          </CardTitle>
                          <CardDescription>Create reward tiers for your backers</CardDescription>
                        </div>
                        <Button onClick={addRewardTier}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Tier
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {errors.rewards && (
                        <Alert>
                          <span className="text-lg">⚠️</span>
                          <AlertDescription>{errors.rewards}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-6">
                        {campaignData.rewards.map((tier, index) => (
                          <RewardTierCard
                            key={tier.id}
                            tier={tier}
                            onUpdate={(updatedTier) => updateRewardTier(index, updatedTier)}
                            onDelete={() => deleteRewardTier(index)}
                          />
                        ))}

                        {campaignData.rewards.length === 0 && (
                          <Card className="border-dashed">
                            <CardContent className="pt-6 text-center">
                              <span className="text-6xl mb-4 block">🎁</span>
                              <h3 className="text-lg font-semibold mb-2">No reward tiers yet</h3>
                              <p className="text-muted-foreground mb-4">
                                Create reward tiers to incentivize backers and offer value for their support.
                              </p>
                              <Button onClick={addRewardTier}>
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

                {/* Milestones Tab */}
                <TabsContent value="milestones" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Milestones
                          </CardTitle>
                          <CardDescription>Define milestones for your project</CardDescription>
                        </div>
                        <Button onClick={addMilestone}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Milestone
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {campaignData.milestones?.map((milestone, index) => (
                        <MilestoneCard
                          key={milestone.id}
                          milestone={milestone}
                          index={index}
                          onUpdate={(updatedMilestone) => updateMilestone(index, updatedMilestone)}
                          onDelete={() => deleteMilestone(index)}
                        />
                      ))}

                      {!campaignData.milestones?.length && (
                        <Card className="border-dashed">
                          <CardContent className="pt-6 text-center">
                            <span className="text-6xl mb-4 block">📅</span>
                            <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
                            <p className="text-muted-foreground mb-4">
                              Define milestones to keep backers updated on your project progress.
                            </p>
                            <Button onClick={addMilestone}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Milestone
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !isConnected} size="lg">
                  {loading ? "Creating Campaign..." : "Create Campaign"}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
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
                    <div className="flex justify-between">
                      <span>Milestones</span>
                      <span
                        className={campaignData.milestones?.length > 0 ? "text-green-500" : "text-muted-foreground"}
                      >
                        {campaignData.milestones?.length > 0 ? "✓" : "○"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <span className="text-lg">💡</span>
                <AlertDescription>
                  <strong>Tip:</strong> Complete all required sections before creating your campaign. You can always
                  edit it later from your dashboard.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
