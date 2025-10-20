"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MediaUpload } from "@/components/ui/media-upload"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichEditor } from "@/components/ui/rich-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import Link from "next/link"
import { ImageIcon, AlertTriangle, Clock, BarChart3, ArrowLeft, Save, Plus, Trash2, CalendarIcon } from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  story: string
  goalAmount: number
  raisedAmount: number
  currency: string
  duration: number
  category: string
  tags: string[]
  status: "DRAFT" | "REVIEW" | "ACTIVE" | "SUCCESSFUL" | "FAILED" | "CANCELLED"
  coverImage?: string
  gallery: string[]
  videoUrl?: string
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  tiers: Tier[]
  milestones: Milestone[]
  socialLinks?: {
    website?: string
    x?: string
    instagram?: string
    youtube?: string
    tiktok?: string
  }
}

interface Tier {
  id: string
  title: string
  description: string
  amount: number
  maxBackers?: number
  isLimited: boolean
  rewards: string[]
  estimatedDelivery?: string
  shippingCost?: number
}

interface Milestone {
  id: string
  title: string
  description: string
  targetDate?: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
}

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        console.log("[v0] Fetching campaign:", params.id)

        const response = await fetch(`/api/campaigns/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch campaign")
        }
        const data = await response.json()

        console.log("[v0] Campaign data received:", data)

        const transformedTiers = Array.isArray(data.tiers)
          ? data.tiers.map((tier: any) => ({
              id: tier.id,
              title: tier.title,
              description: tier.description,
              amount: Number(tier.amount),
              isLimited: tier.is_limited || false,
              maxBackers: tier.max_backers || undefined,
              rewards: Array.isArray(tier.rewards) ? tier.rewards : [],
              estimatedDelivery: tier.estimated_delivery,
              shippingCost: tier.shipping_cost,
            }))
          : []

        const transformedCampaign: Campaign = {
          id: data.id,
          title: data.title,
          description: data.description,
          story: data.story || "",
          goalAmount: Number(data.goal_amount),
          raisedAmount: Number(data.raised_amount),
          currency: data.currency,
          duration: data.duration,
          category: data.category,
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: data.status,
          coverImage: data.cover_image,
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          videoUrl: data.video_url,
          startDate: data.start_date,
          endDate: data.end_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          tiers: transformedTiers,
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
          socialLinks: data.social_links || {},
        }

        console.log("[v0] Transformed campaign:", transformedCampaign)
        console.log("[v0] Transformed tiers:", transformedTiers)
        setCampaign(transformedCampaign)
      } catch (error) {
        console.error("[v0] Error fetching campaign:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCampaign()
    }
  }, [params.id])

  const handleSave = async () => {
    if (!campaign) return

    setSaving(true)
    try {
      console.log("[v0] Saving campaign with tiers:", campaign.tiers)

      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: campaign.title,
          description: campaign.description,
          story: campaign.story,
          goal_amount: campaign.goalAmount,
          currency: campaign.currency,
          duration: campaign.duration,
          category: campaign.category,
          tags: campaign.tags,
          status: campaign.status,
          cover_image: campaign.coverImage,
          gallery: campaign.gallery,
          video_url: campaign.videoUrl,
          start_date: campaign.startDate,
          end_date: campaign.endDate,
          tiers: campaign.tiers.map((tier) => ({
            id: tier.id,
            title: tier.title,
            description: tier.description,
            amount: tier.amount,
            isLimited: tier.isLimited,
            maxBackers: tier.maxBackers,
            rewards: tier.rewards || [],
            estimatedDelivery: tier.estimatedDelivery,
            shippingCost: tier.shippingCost,
          })),
          milestones: campaign.milestones,
          social_links: campaign.socialLinks,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save campaign")
      }

      console.log("[v0] Campaign saved successfully")
      router.push(`/campaigns/${campaign.id}`)
    } catch (error) {
      console.error("Failed to save campaign:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateCampaign = useCallback((updates: Partial<Campaign>) => {
    setCampaign((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const addTier = () => {
    if (!campaign) return

    const newTier: Tier = {
      id: Date.now().toString(),
      title: "New Tier",
      description: "",
      amount: 0,
      isLimited: false,
      rewards: [],
    }

    updateCampaign({
      tiers: [...campaign.tiers, newTier],
    })
  }

  const updateTier = useCallback(
    (tierId: string, updates: Partial<Tier>) => {
      if (!campaign) return

      updateCampaign({
        tiers: campaign.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier)),
      })
    },
    [campaign, updateCampaign],
  )

  const removeTier = (tierId: string) => {
    if (!campaign) return

    updateCampaign({
      tiers: campaign.tiers.filter((tier) => tier.id !== tierId),
    })
  }

  const addMilestone = () => {
    if (!campaign) return

    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: "New Milestone",
      description: "",
      status: "PENDING",
    }

    updateCampaign({
      milestones: [...campaign.milestones, newMilestone],
    })
  }

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    if (!campaign) return

    updateCampaign({
      milestones: campaign.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      ),
    })
  }

  const removeMilestone = (milestoneId: string) => {
    if (!campaign) return

    updateCampaign({
      milestones: campaign.milestones.filter((milestone) => milestone.id !== milestoneId),
    })
  }

  const handleCoverImageChange = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        console.log("[v0] Cover image changed:", files[0].name)
        const url = URL.createObjectURL(files[0])
        updateCampaign({ coverImage: url })
      }
    },
    [updateCampaign],
  )

  const handleGalleryChange = useCallback(
    (files: File[]) => {
      console.log("[v0] Gallery images changed:", files.length)
      if (files.length > 0) {
        const urls = files.map((file) => URL.createObjectURL(file))
        updateCampaign({ gallery: urls })
      }
    },
    [updateCampaign],
  )

  const handleEndDateChange = (endDate: string) => {
    if (campaign?.startDate && endDate) {
      const start = new Date(campaign.startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      updateCampaign({ endDate, duration: diffDays })
    } else {
      updateCampaign({ endDate })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please connect your wallet to edit campaigns</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-48 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>The campaign you're trying to edit doesn't exist</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/campaigns/${campaign.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Campaign</h1>
              <p className="text-muted-foreground">Manage your campaign settings and content</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${campaign.id}`}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg" className="bg-primary hover:bg-primary/90">
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {/* Tabs component with Basic Info, Media, and Reward Tiers */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-primary/20">
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
                    <CardDescription>Edit your campaign information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        value={campaign.title}
                        onChange={(e) => updateCampaign({ title: e.target.value })}
                        placeholder="Revolutionary VR Headset for Everyone"
                        className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Short Description *</Label>
                      <Textarea
                        id="description"
                        value={campaign.description}
                        onChange={(e) => updateCampaign({ description: e.target.value })}
                        placeholder="A brief description of your campaign"
                        rows={3}
                        className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="story">Campaign Story *</Label>
                      <RichEditor
                        content={campaign.story}
                        onChange={(content) => updateCampaign({ story: content })}
                        placeholder="Tell your story. What makes your project special?"
                        className="border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={campaign.category}
                          onValueChange={(value) => updateCampaign({ category: value })}
                        >
                          <SelectTrigger className="border-2 border-border bg-zinc-800">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="games">Games</SelectItem>
                            <SelectItem value="film">Film & Video</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                            <SelectItem value="fashion">Fashion</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="publishing">Publishing</SelectItem>
                            <SelectItem value="crafts">Crafts</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <Input
                          id="tags"
                          value={campaign.tags.join(", ")}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                            updateCampaign({ tags })
                          }}
                          placeholder="VR, Gaming, Technology"
                          className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Social Links section */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Social Links</Label>
                        <p className="text-sm text-muted-foreground">
                          Add your social media links to help backers connect with you
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={campaign.socialLinks?.website || ""}
                            onChange={(e) =>
                              updateCampaign({
                                socialLinks: { ...campaign.socialLinks, website: e.target.value },
                              })
                            }
                            placeholder="https://yourwebsite.com"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="x">X (Twitter)</Label>
                          <Input
                            id="x"
                            type="url"
                            value={campaign.socialLinks?.x || ""}
                            onChange={(e) =>
                              updateCampaign({
                                socialLinks: { ...campaign.socialLinks, x: e.target.value },
                              })
                            }
                            placeholder="https://x.com/yourhandle"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            type="url"
                            value={campaign.socialLinks?.instagram || ""}
                            onChange={(e) =>
                              updateCampaign({
                                socialLinks: { ...campaign.socialLinks, instagram: e.target.value },
                              })
                            }
                            placeholder="https://instagram.com/yourhandle"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="youtube">YouTube</Label>
                          <Input
                            id="youtube"
                            type="url"
                            value={campaign.socialLinks?.youtube || ""}
                            onChange={(e) =>
                              updateCampaign({
                                socialLinks: { ...campaign.socialLinks, youtube: e.target.value },
                              })
                            }
                            placeholder="https://youtube.com/@yourchannel"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tiktok">TikTok</Label>
                          <Input
                            id="tiktok"
                            type="url"
                            value={campaign.socialLinks?.tiktok || ""}
                            onChange={(e) =>
                              updateCampaign({
                                socialLinks: { ...campaign.socialLinks, tiktok: e.target.value },
                              })
                            }
                            placeholder="https://tiktok.com/@yourhandle"
                            className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goalAmount">Funding Goal (USD) *</Label>
                        <Input
                          id="goalAmount"
                          type="number"
                          value={campaign.goalAmount}
                          onChange={(e) => updateCampaign({ goalAmount: Number(e.target.value) })}
                          placeholder="50000"
                          className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Campaign End Date *</Label>
                        <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal border-2 bg-zinc-800 hover:bg-background"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {campaign.endDate ? (
                                format(new Date(campaign.endDate), "PPP")
                              ) : (
                                <span className="text-muted-foreground">Pick an end date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={campaign.endDate ? new Date(campaign.endDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  updateCampaign({ endDate: date.toISOString() })
                                  setIsEndDateOpen(false)
                                }
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                    <CardDescription>Upload images and videos to showcase your campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <p className="text-sm text-muted-foreground">
                        Main image that represents your campaign (recommended: 1920x1080)
                      </p>
                      <MediaUpload
                        type="image"
                        title=""
                        description=""
                        multiple={false}
                        maxFiles={1}
                        initialFiles={campaign.coverImage ? [campaign.coverImage] : []}
                        onFilesChange={handleCoverImageChange}
                        enableCompression={true}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Gallery Images</Label>
                      <p className="text-sm text-muted-foreground">
                        Additional images to showcase your project (up to 10 images)
                      </p>
                      <MediaUpload
                        type="image"
                        title=""
                        description=""
                        multiple={true}
                        maxFiles={10}
                        initialFiles={campaign.gallery}
                        onFilesChange={handleGalleryChange}
                        enableCompression={true}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Campaign Video (Optional)</Label>
                      <Input
                        id="videoUrl"
                        value={campaign.videoUrl || ""}
                        onChange={(e) => updateCampaign({ videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-sm text-muted-foreground">YouTube, Vimeo, or direct video URL</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tiers" className="space-y-6">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Reward Tiers</CardTitle>
                        <CardDescription>Manage reward tiers for your backers</CardDescription>
                      </div>
                      <Button onClick={addTier} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tier
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {campaign.tiers.length === 0 ? (
                      <Card className="border-dashed border-2">
                        <CardContent className="pt-6 text-center">
                          <span className="text-6xl mb-4 block">🎁</span>
                          <h3 className="text-lg font-semibold mb-2">No reward tiers yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Create reward tiers to incentivize backers and offer value for their support.
                          </p>
                          <Button onClick={addTier} className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Tier
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        {campaign.tiers.map((tier) => (
                          <Card key={tier.id} className="border-2 border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-lg">Reward Tier</CardTitle>
                              <Button variant="ghost" size="sm" onClick={() => removeTier(tier.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Title *</Label>
                                  <Input
                                    value={tier.title}
                                    onChange={(e) => updateTier(tier.id, { title: e.target.value })}
                                    placeholder="Early Bird Special"
                                    className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount (USD) *</Label>
                                  <Input
                                    type="number"
                                    value={tier.amount}
                                    onChange={(e) => updateTier(tier.id, { amount: Number(e.target.value) })}
                                    placeholder="25"
                                    className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description *</Label>
                                <Textarea
                                  value={tier.description}
                                  onChange={(e) => updateTier(tier.id, { description: e.target.value })}
                                  placeholder="What backers will receive for this pledge amount"
                                  rows={3}
                                  className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Limited Quantity</Label>
                                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border bg-zinc-800/50">
                                    <Switch
                                      checked={tier.isLimited}
                                      onCheckedChange={(checked) => updateTier(tier.id, { isLimited: checked })}
                                    />
                                    <Label className="cursor-pointer flex-1 text-sm font-medium">
                                      {tier.isLimited ? "✓ Limited quantity enabled" : "Enable limited quantity"}
                                    </Label>
                                  </div>
                                  {tier.isLimited && (
                                    <Input
                                      type="number"
                                      value={tier.maxBackers || ""}
                                      onChange={(e) => updateTier(tier.id, { maxBackers: Number(e.target.value) })}
                                      placeholder="100"
                                      className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                                    />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Campaign Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge
                    variant={
                      campaign.status === "ACTIVE"
                        ? "default"
                        : campaign.status === "SUCCESSFUL"
                          ? "default"
                          : campaign.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400 font-medium">Raised</span>
                    <span className="font-medium">${campaign.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Goal</span>
                    <span className="font-medium">${campaign.goalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span>{campaign.duration} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View Campaign
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/dashboard">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Save Reminder */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Remember to save your changes before leaving this page.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
