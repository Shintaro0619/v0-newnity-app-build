"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RichEditor } from "@/components/ui/rich-editor"
import { MediaUpload } from "@/components/ui/media-upload"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Save,
  Eye,
  Settings,
  ImageIcon,
  Target,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  BarChart3,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

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

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/campaigns/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch campaign")
        }
        const data = await response.json()

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
          tiers: Array.isArray(data.tiers) ? data.tiers : [],
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
        }

        setCampaign(transformedCampaign)
      } catch (error) {
        console.error("Error fetching campaign:", error)
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
          tiers: campaign.tiers,
          milestones: campaign.milestones,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save campaign")
      }

      // Show success message or redirect
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
        const url = URL.createObjectURL(files[0])
        updateCampaign({ coverImage: url })
      }
    },
    [updateCampaign],
  )

  const handleGalleryChange = useCallback(
    (files: File[]) => {
      const urls = files.map((file) => URL.createObjectURL(file))
      updateCampaign({ gallery: urls })
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
                <Eye className="h-4 w-4 mr-2" />
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="h-5 w-5" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription>Update your campaign's basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        value={campaign.title}
                        onChange={(e) => updateCampaign({ title: e.target.value })}
                        placeholder="Enter campaign title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Short Description</Label>
                      <Textarea
                        id="description"
                        value={campaign.description}
                        onChange={(e) => updateCampaign({ description: e.target.value })}
                        placeholder="Brief description of your campaign"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={campaign.category}
                          onValueChange={(value) => updateCampaign({ category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Art">Art</SelectItem>
                            <SelectItem value="VTuber">VTuber</SelectItem>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Film">Film</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={campaign.tags.join(", ")}
                          onChange={(e) => updateCampaign({ tags: e.target.value.split(", ").filter(Boolean) })}
                          placeholder="VR, Gaming, Cyberpunk"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Campaign Story</Label>
                      <RichEditor
                        content={campaign.story}
                        onChange={(content) => updateCampaign({ story: content })}
                        placeholder="Tell your campaign's story in detail..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Funding Goals
                    </CardTitle>
                    <CardDescription>Set your funding target and timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="goalAmount">Funding Goal</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="goalAmount"
                            type="number"
                            value={campaign.goalAmount}
                            onChange={(e) => updateCampaign({ goalAmount: Number(e.target.value) })}
                            className="pl-10"
                            placeholder="50000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Campaign End Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                          <Input
                            id="endDate"
                            type="date"
                            value={campaign.endDate ? campaign.endDate.split("T")[0] : ""}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className="pl-10"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">Duration: {campaign.duration} days</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Progress</Label>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>${campaign.raisedAmount.toLocaleString()} raised</span>
                          <span>{Math.round(progressPercentage)}% of goal</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
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
                  <CardContent className="space-y-6">
                    <MediaUpload
                      type="image"
                      title="Cover Image"
                      description="Main image that represents your campaign (recommended: 1920x1080)"
                      multiple={false}
                      maxFiles={1}
                      onFilesChange={handleCoverImageChange}
                      enableCompression={true}
                      initialFiles={campaign.coverImage ? [campaign.coverImage] : []}
                    />

                    <Separator />

                    <MediaUpload
                      type="image"
                      title="Gallery Images"
                      description="Additional images to showcase your project (up to 10 images)"
                      multiple={true}
                      maxFiles={10}
                      onFilesChange={handleGalleryChange}
                      enableCompression={true}
                      initialFiles={campaign.gallery}
                    />

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
                      <Button onClick={addTier}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tier
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {campaign.tiers.map((tier, index) => (
                      <Card key={tier.id} className="relative">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Tier {index + 1}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTier(tier.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Tier Name</Label>
                              <Input
                                value={tier.title}
                                onChange={(e) => updateTier(tier.id, { title: e.target.value })}
                                placeholder="Early Bird"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Pledge Amount</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={tier.amount || ""}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? 0 : Number(e.target.value)
                                    updateTier(tier.id, { amount: value })
                                  }}
                                  onFocus={(e) => {
                                    if (e.target.value === "0") {
                                      e.target.select()
                                    }
                                  }}
                                  className="pl-10"
                                  placeholder="25"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={tier.description}
                              onChange={(e) => updateTier(tier.id, { description: e.target.value })}
                              placeholder="What backers get with this tier"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Rewards</Label>
                            <Textarea
                              value={tier.rewards.join("\n")}
                              onChange={(e) =>
                                updateTier(tier.id, { rewards: e.target.value.split("\n").filter(Boolean) })
                              }
                              placeholder="Digital copy of the game&#10;Early access beta&#10;Digital soundtrack"
                              rows={3}
                            />
                            <p className="text-sm text-muted-foreground">One reward per line</p>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={tier.isLimited}
                                onCheckedChange={(checked) => updateTier(tier.id, { isLimited: checked })}
                              />
                              <Label>Limited quantity</Label>
                            </div>

                            {tier.isLimited && (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={tier.maxBackers || ""}
                                  onChange={(e) =>
                                    updateTier(tier.id, { maxBackers: Number(e.target.value) || undefined })
                                  }
                                  placeholder="Max backers"
                                  className="w-32"
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Estimated Delivery</Label>
                              <Input
                                type="date"
                                value={tier.estimatedDelivery || ""}
                                onChange={(e) => updateTier(tier.id, { estimatedDelivery: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Shipping Cost (Optional)</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={tier.shippingCost || ""}
                                  onChange={(e) =>
                                    updateTier(tier.id, { shippingCost: Number(e.target.value) || undefined })
                                  }
                                  className="pl-10"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {campaign.tiers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No reward tiers yet. Add your first tier to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
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
                    <span>Raised</span>
                    <span className="font-medium">${campaign.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goal</span>
                    <span>${campaign.goalAmount.toLocaleString()}</span>
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
                    <Eye className="h-4 w-4 mr-2" />
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
                    <Settings className="h-4 w-4 mr-2" />
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
