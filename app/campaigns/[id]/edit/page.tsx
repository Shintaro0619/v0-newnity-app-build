"use client"

import { useState, useCallback, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichEditor } from "@/components/ui/rich-editor"
import { DatePicker } from "@/components/ui/date-picker"
import { Alert } from "@/components/ui/alert"
import { Save, ArrowLeft, Trash2 } from "lucide-react"

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
    mainImageUrl: string
    gallery: File[]
    galleryUrls: string[]
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

export default function EditCampaignPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<(File | string)[]>([])

  const handleMediaError = useCallback((error: string) => {
    setErrors((prev) => ({ ...prev, media: error }))
  }, [])

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`)
        if (!response.ok) throw new Error("Failed to fetch campaign")

        const data = await response.json()

        // Parse social_links from JSON string if needed
        let socialLinks = {
          website: "",
          x: "",
          instagram: "",
          youtube: "",
          tiktok: "",
        }

        if (data.social_links) {
          try {
            socialLinks = typeof data.social_links === "string" ? JSON.parse(data.social_links) : data.social_links
          } catch (e) {
            console.error("Failed to parse social_links:", e)
          }
        }

        const rewardTiers = (data.tiers || []).map((tier: any) => ({
          id: tier.id || Date.now().toString(),
          title: tier.title || "",
          description: tier.description || "",
          amount: Number(tier.amount) || 0,
          deliveryDate: tier.estimated_delivery ? new Date(tier.estimated_delivery) : undefined,
          quantity: tier.max_backers || null,
          isLimited: tier.is_limited || false,
          items: tier.rewards || [],
        }))

        setCampaignData({
          basic: {
            title: data.title || "",
            subtitle: data.description || "",
            description: data.story || "",
            category: data.category || "",
            tags: data.tags || [],
            socialLinks,
          },
          media: {
            mainImage: null,
            mainImageUrl: data.cover_image || "",
            gallery: [],
            galleryUrls: data.gallery || [],
            video: null,
            youtubeUrl: data.video_url || "",
          },
          funding: {
            goal: Number(data.goal_amount) || 0,
            endDate: data.end_date ? new Date(data.end_date) : undefined,
            currency: data.currency || "USD",
            minPledge: data.min_contribution_usdc ? Number(data.min_contribution_usdc) / 1000000 : 1,
          },
          rewards: rewardTiers,
        })

        setGalleryFiles(data.gallery || [])
      } catch (error) {
        console.error("Failed to fetch campaign:", error)
        setErrors({ fetch: "Failed to load campaign data" })
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [campaignId])

  const handleMainImageChange = useCallback((files: File[]) => {
    setCoverImage(files[0] || null)
    setCampaignData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        media: {
          ...prev.media,
          mainImage: files[0] || null,
          mainImageUrl: files[0] ? URL.createObjectURL(files[0]) : prev.media.mainImageUrl,
        },
      }
    })
  }, [])

  const handleGalleryChange = useCallback((files: File[]) => {
    setGalleryFiles((prev) => {
      // Keep existing URLs (strings)
      const existingUrls = prev.filter((item) => typeof item === "string")
      // Add new files
      return [...existingUrls, ...files]
    })
  }, [])

  const addRewardTier = () => {
    if (!campaignData) return
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
    setCampaignData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rewards: [...prev.rewards, newTier],
      }
    })
  }

  const updateRewardTier = (index: number, updatedTier: RewardTier) => {
    setCampaignData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rewards: prev.rewards.map((tier, i) => (i === index ? updatedTier : tier)),
      }
    })
  }

  const deleteRewardTier = (index: number) => {
    setCampaignData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rewards: prev.rewards.filter((_, i) => i !== index),
      }
    })
  }

  const handleSave = async () => {
    if (!campaignData) return

    setSaving(true)
    setErrors({})

    try {
      console.log("[v0] Starting campaign save...")

      let coverImageUrl = campaignData.media.mainImageUrl
      if (coverImage) {
        console.log("[v0] Uploading cover image...")
        const formData = new FormData()
        formData.append("file", coverImage)
        formData.append("type", "campaign")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload cover image")
        }

        const uploadResult = await uploadResponse.json()
        coverImageUrl = uploadResult.url
        console.log("[v0] Cover image uploaded:", coverImageUrl)
      }

      let galleryUrls = [...campaignData.media.galleryUrls]
      if (galleryFiles.length > 0) {
        console.log("[v0] Processing gallery files...")
        const uploadedUrls: string[] = []

        for (const item of galleryFiles) {
          // If it's a File object, upload it
          if (item instanceof File) {
            console.log("[v0] Uploading new gallery image:", item.name)
            const formData = new FormData()
            formData.append("file", item)
            formData.append("type", "campaign")

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!uploadResponse.ok) {
              throw new Error("Failed to upload gallery image")
            }

            const uploadResult = await uploadResponse.json()
            uploadedUrls.push(uploadResult.url)
          } else if (typeof item === "string") {
            // If it's a string (existing URL), keep it
            uploadedUrls.push(item)
          }
        }

        // Replace gallery URLs with the processed list
        galleryUrls = uploadedUrls
        console.log("[v0] Gallery images processed:", galleryUrls)
      }

      const minPledgeUsdc =
        campaignData.funding.minPledge > 0 ? Math.floor(campaignData.funding.minPledge * 1000000) : 1000000

      console.log("[v0] Min pledge calculation:", {
        minPledge: campaignData.funding.minPledge,
        minPledgeUsdc,
      })

      const duration = campaignData.funding.endDate
        ? Math.ceil((campaignData.funding.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30

      console.log("[v0] Duration calculation:", {
        endDate: campaignData.funding.endDate,
        duration,
      })

      const updatePayload = {
        title: campaignData.basic.title,
        description: campaignData.basic.subtitle,
        story: campaignData.basic.description,
        category: campaignData.basic.category,
        tags: campaignData.basic.tags,
        goal_amount: campaignData.funding.goal,
        end_date: campaignData.funding.endDate?.toISOString(),
        duration,
        min_contribution_usdc: minPledgeUsdc,
        video_url: campaignData.media.youtubeUrl || null,
        cover_image: coverImageUrl,
        gallery: galleryUrls,
        tiers: campaignData.rewards.map((reward) => ({
          id: reward.id,
          title: reward.title,
          description: reward.description,
          amount: reward.amount,
          isLimited: reward.isLimited,
          quantity: reward.quantity,
          items: reward.items,
          deliveryDate: reward.deliveryDate ? reward.deliveryDate.toISOString() : null,
        })),
      }

      console.log("[v0] Update payload:", JSON.stringify(updatePayload, null, 2))

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          throw new Error(`Failed to save campaign: ${errorText}`)
        }

        throw new Error(errorData.error || "Failed to save campaign")
      }

      const result = await response.json()
      console.log("[v0] Campaign saved successfully:", result)

      router.push(`/campaigns/${campaignId}`)
    } catch (error) {
      console.error("[v0] Failed to save campaign:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Failed to save campaign" })
    } finally {
      setSaving(false)
    }
  }

  const RewardTierCard = ({
    tier,
    index,
    onUpdate,
    onDelete,
  }: {
    tier: RewardTier
    index: number
    onUpdate: (tier: RewardTier) => void
    onDelete: () => void
  }) => {
    return (
      <Card className="border-2 border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Reward Tier</CardTitle>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={tier.title}
                onChange={(e) => onUpdate({ ...tier, title: e.target.value })}
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
                  value={tier.amount === 0 ? "" : tier.amount}
                  onChange={(e) => onUpdate({ ...tier, amount: Number(e.target.value) })}
                  placeholder="25"
                  className="pl-10 border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <RichEditor
              content={tier.description}
              onChange={(content) => onUpdate({ ...tier, description: content })}
              placeholder="What backers will receive for this pledge amount"
              className="min-h-[120px] border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Delivery</Label>
              <DatePicker
                value={tier.deliveryDate}
                onChange={(d) => onUpdate({ ...tier, deliveryDate: d })}
                placeholder="Pick a date"
              />
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
                  value={tier.quantity || ""}
                  onChange={(e) => onUpdate({ ...tier, quantity: Number(e.target.value) || null })}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-8">
          <div className="space-y-8">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="h-12 bg-muted animate-pulse rounded" />
                  <div className="h-12 bg-muted animate-pulse rounded" />
                  <div className="h-32 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!campaignData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <p className="text-destructive">Failed to load campaign data</p>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Edit Campaign</h1>
              <p className="text-muted-foreground">Update your campaign details</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {errors.submit && (
            <Alert className="border-2 border-destructive bg-destructive/10">
              <p className="text-sm font-semibold text-destructive">{errors.submit}</p>
            </Alert>
          )}

          {/* Main Content */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Funding Goals</CardTitle>
                <CardDescription>Update your funding target and timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Campaign End Date *</Label>
                    <DatePicker
                      value={campaignData.funding.endDate}
                      onChange={(d) =>
                        setCampaignData((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            funding: { ...prev.funding, endDate: d },
                          }
                        })
                      }
                      placeholder="Pick an end date"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
