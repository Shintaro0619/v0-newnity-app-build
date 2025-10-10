"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RichEditor } from "@/components/ui/rich-editor"
import Link from "next/link"
import { useDropzone } from "react-dropzone"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { useAccount } from "wagmi"
import { parseUnits } from "viem"

import { MediaUpload } from "@/components/ui/media-upload"

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
    duration: number
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
  deliveryDate: string
  quantity: number | null
  isLimited: boolean
  items: string[]
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
    duration: 30,
    currency: "USD",
    minPledge: 1,
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
  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState<CampaignData>(initialCampaignData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const MediaUploadOld = ({
    type,
    title,
    description,
    acceptedTypes,
    multiple = false,
    files,
    onFileChange,
  }: {
    type: "image" | "video"
    title: string
    description: string
    acceptedTypes: string
    multiple?: boolean
    files: File | File[] | null
    onFileChange: (files: File | File[] | null) => void
  }) => {
    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        if (multiple) {
          onFileChange(acceptedFiles)
        } else if (acceptedFiles.length > 0) {
          onFileChange(acceptedFiles[0])
        }
      },
      [onFileChange, multiple],
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept:
        type === "image" ? { "image/*": [".png", ".jpg", ".jpeg", ".gif"] } : { "video/*": [".mp4", ".mov", ".avi"] },
      multiple,
      maxSize: type === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024, // 100MB for video, 10MB for images
    })

    const hasFiles = multiple ? (files as File[])?.length > 0 : files !== null

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : hasFiles
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-muted-foreground/25 hover:border-primary"
          }`}
        >
          <input {...getInputProps()} />

          {hasFiles ? (
            <div className="space-y-2">
              <span className="text-2xl text-green-500 mx-auto">✓</span>
              {multiple ? (
                <p className="font-medium text-green-700 dark:text-green-400">
                  {(files as File[]).length} files uploaded
                </p>
              ) : (
                <p className="font-medium text-green-700 dark:text-green-400">{(files as File).name}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileChange(multiple ? [] : null)
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {type === "image" ? (
                <span className="text-2xl text-muted-foreground mx-auto">🖼️</span>
              ) : (
                <span className="text-2xl text-muted-foreground mx-auto">🎥</span>
              )}
              <p className="font-medium">{isDragActive ? "Drop the files here" : "Drag & drop or click to upload"}</p>
              <p className="text-sm text-muted-foreground">{acceptedTypes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

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
                  value={localAmount}
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
              <Input
                type="date"
                value={tier.deliveryDate}
                onChange={(e) => onUpdate({ ...tier, deliveryDate: e.target.value })}
              />
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

  const addRewardTier = () => {
    const newTier: RewardTier = {
      id: Date.now().toString(),
      title: "",
      description: "",
      amount: 0,
      deliveryDate: "",
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
      if (!campaignData.funding.duration || campaignData.funding.duration <= 0) {
        newErrors.duration = "Campaign duration must be greater than 0"
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

  const { address, isConnected } = useAccount()
  const { handleCreateCampaign, isCreatePending, isCreateLoading } = useCampaignContract()

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    if (!isConnected) {
      setErrors({ wallet: "Please connect your wallet first" })
      return
    }

    setLoading(true)
    try {
      const goalInUsdc = parseUnits(campaignData.funding.goal.toString(), 6) // USDC has 6 decimals
      const durationInSeconds = BigInt(campaignData.funding.duration * 24 * 60 * 60)

      console.log("[v0] Creating campaign on-chain:", {
        goal: goalInUsdc.toString(),
        duration: durationInSeconds.toString(),
      })

      handleCreateCampaign(goalInUsdc.toString(), campaignData.funding.duration)

      console.log("[v0] Campaign creation transaction submitted")

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignData,
          creatorAddress: address,
        }),
      })

      if (!response.ok) throw new Error("Failed to save campaign")

      setCurrentStep(5)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-4xl">🚀</span>
              <h1 className="text-3xl font-bold">Create Your Campaign</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Launch your project and bring your ideas to life with the support of our community.
            </p>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Basics</span>
                  <span>Media</span>
                  <span>Funding</span>
                  <span>Rewards</span>
                  <span>Launch</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📄</span>
                    <h2 className="text-xl font-semibold">Campaign Basics</h2>
                  </div>

                  <div className="space-y-6">
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
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🖼️</span>
                    <h2 className="text-xl font-semibold">Campaign Media</h2>
                  </div>

                  <Alert>
                    <span className="text-lg">ℹ️</span>
                    <AlertDescription>
                      High-quality images and videos significantly increase campaign success rates. Make sure your media
                      clearly shows your product or project.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-8">
                    <MediaUpload
                      type="image"
                      title="Main Campaign Image *"
                      description="This will be the primary image shown on your campaign page"
                      maxSize={10 * 1024 * 1024}
                      enableCompression={true}
                      showPreview={true}
                      onFilesChange={(files) =>
                        setCampaignData((prev) => ({
                          ...prev,
                          media: { ...prev.media, mainImage: files[0] || null },
                        }))
                      }
                      onError={(error) => setErrors((prev) => ({ ...prev, mainImage: error }))}
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
                      onFilesChange={(files) =>
                        setCampaignData((prev) => ({
                          ...prev,
                          media: { ...prev.media, gallery: files },
                        }))
                      }
                      onError={(error) => console.error("Gallery upload error:", error)}
                    />

                    <Separator />

                    <MediaUpload
                      type="video"
                      title="Campaign Video"
                      description="A video pitch can significantly boost your campaign (optional)"
                      maxSize={100 * 1024 * 1024}
                      showPreview={true}
                      onFilesChange={(files) =>
                        setCampaignData((prev) => ({
                          ...prev,
                          media: { ...prev.media, video: files[0] || null },
                        }))
                      }
                      onError={(error) => console.error("Video upload error:", error)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🎯</span>
                    <h2 className="text-xl font-semibold">Funding Goals</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="goal">Funding Goal (USD) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="goal"
                          type="number"
                          value={campaignData.funding.goal}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              funding: { ...prev.funding, goal: Number(e.target.value) },
                            }))
                          }
                          placeholder="50000"
                          className={`pl-10 ${errors.goal ? "border-destructive" : ""}`}
                        />
                      </div>
                      {errors.goal && <p className="text-sm text-destructive">{errors.goal}</p>}
                      <p className="text-xs text-muted-foreground">Set a realistic goal based on your project needs</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Campaign Duration (days) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          📅
                        </span>
                        <Input
                          id="duration"
                          type="number"
                          value={campaignData.funding.duration}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              funding: { ...prev.funding, duration: Number(e.target.value) },
                            }))
                          }
                          placeholder="30"
                          className={`pl-10 ${errors.duration ? "border-destructive" : ""}`}
                        />
                      </div>
                      {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                      <p className="text-xs text-muted-foreground">Most successful campaigns run for 30-60 days</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minPledge">Minimum Pledge (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="minPledge"
                          type="number"
                          value={campaignData.funding.minPledge}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              funding: { ...prev.funding, minPledge: Number(e.target.value) },
                            }))
                          }
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
                      Remember: This is an all-or-nothing funding model. You only receive funds if you reach your goal.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🎁</span>
                      <h2 className="text-xl font-semibold">Reward Tiers</h2>
                    </div>
                    <Button onClick={addRewardTier}>
                      <span className="mr-2">➕</span>
                      Add Tier
                    </Button>
                  </div>

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
                            <span className="mr-2">➕</span>
                            Create Your First Tier
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6 text-center">
                  <div className="space-y-4">
                    <span className="text-8xl block">✅</span>
                    <h2 className="text-2xl font-semibold">Campaign Saved as Draft!</h2>
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="text-muted-foreground">
                        Your campaign has been saved successfully. To make it live and start accepting pledges, you need
                        to deploy it to the blockchain.
                      </p>
                      <Alert className="text-left">
                        <span className="text-lg">ℹ️</span>
                        <AlertDescription>
                          <strong>Next Step:</strong> Deploy your campaign to the blockchain. This requires a one-time
                          transaction fee (gas) and makes your campaign publicly visible.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button asChild size="lg">
                      <Link href="/dashboard">
                        <span className="mr-2">🚀</span>
                        Go to Dashboard & Deploy
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/campaigns">Browse Campaigns</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                <span className="mr-2">←</span>
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <span className="ml-2">→</span>
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || isCreatePending || isCreateLoading}>
                  {loading || isCreatePending || isCreateLoading ? "Creating Campaign..." : "Create Campaign"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
