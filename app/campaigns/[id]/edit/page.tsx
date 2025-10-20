"use client"

import { useState, useCallback, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RichEditor } from "@/components/ui/rich-editor"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert } from "@/components/ui/alert"
import { format } from "date-fns"
import { MediaUpload } from "@/components/ui/media-upload"
import { Save, ArrowLeft, CalendarIcon, Plus, Trash2 } from "lucide-react"

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
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

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
            minPledge: Number(data.min_contribution_usdc) / 1000000 || 1,
          },
          rewards: (data.reward_tiers || []).map((tier: any) => ({
            id: tier.id || Date.now().toString(),
            title: tier.title || "",
            description: tier.description || "",
            amount: Number(tier.amount) || 0,
            deliveryDate: tier.delivery_date ? new Date(tier.delivery_date) : undefined,
            quantity: tier.quantity || null,
            isLimited: tier.is_limited || false,
            items: tier.items || [],
          })),
        })
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
    setCampaignData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        media: {
          ...prev.media,
          gallery: files,
          galleryUrls: files.map((f) => URL.createObjectURL(f)),
        },
      }
    })
  }, [])

  const handleMediaError = useCallback((error: string) => {
    setErrors((prev) => ({ ...prev, media: error }))
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
    try {
      const formData = new FormData()

      const duration = campaignData.funding.endDate
        ? Math.ceil((campaignData.funding.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30

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
          },
          rewards: campaignData.rewards.map((reward) => ({
            ...reward,
            deliveryDate: reward.deliveryDate ? reward.deliveryDate.toISOString() : "",
          })),
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

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save campaign")
      }

      router.push(`/campaigns/${campaignId}`)
    } catch (error) {
      console.error("Failed to save campaign:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Failed to save campaign" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-primary/20">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="funding">Funding</TabsTrigger>
              <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>Update your project information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title *</Label>
                    <Input
                      id="title"
                      value={campaignData.basic.title}
                      onChange={(e) =>
                        setCampaignData((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            basic: { ...prev.basic, title: e.target.value },
                          }
                        })
                      }
                      className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle *</Label>
                    <Input
                      id="subtitle"
                      value={campaignData.basic.subtitle}
                      onChange={(e) =>
                        setCampaignData((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            basic: { ...prev.basic, subtitle: e.target.value },
                          }
                        })
                      }
                      className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Campaign Description *</Label>
                    <RichEditor
                      content={campaignData.basic.description}
                      onChange={(content) =>
                        setCampaignData((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            basic: { ...prev.basic, description: content },
                          }
                        })
                      }
                      className="border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={campaignData.basic.category}
                        onValueChange={(value) =>
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              basic: { ...prev.basic, category: value },
                            }
                          })
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={campaignData.basic.tags.join(", ")}
                        onChange={(e) => {
                          const value = e.target.value
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              basic: {
                                ...prev.basic,
                                tags: value ? [value] : [],
                              },
                            }
                          })
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          const tags = value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              basic: { ...prev.basic, tags },
                            }
                          })
                        }}
                        className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

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
                          value={campaignData.basic.socialLinks.website}
                          onChange={(e) =>
                            setCampaignData((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  socialLinks: { ...prev.basic.socialLinks, website: e.target.value },
                                },
                              }
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
                          value={campaignData.basic.socialLinks.x}
                          onChange={(e) =>
                            setCampaignData((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  socialLinks: { ...prev.basic.socialLinks, x: e.target.value },
                                },
                              }
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
                          value={campaignData.basic.socialLinks.instagram}
                          onChange={(e) =>
                            setCampaignData((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  socialLinks: { ...prev.basic.socialLinks, instagram: e.target.value },
                                },
                              }
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
                          value={campaignData.basic.socialLinks.youtube}
                          onChange={(e) =>
                            setCampaignData((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  socialLinks: { ...prev.basic.socialLinks, youtube: e.target.value },
                                },
                              }
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
                          value={campaignData.basic.socialLinks.tiktok}
                          onChange={(e) =>
                            setCampaignData((prev) => {
                              if (!prev) return prev
                              return {
                                ...prev,
                                basic: {
                                  ...prev.basic,
                                  socialLinks: { ...prev.basic.socialLinks, tiktok: e.target.value },
                                },
                              }
                            })
                          }
                          placeholder="https://tiktok.com/@yourhandle"
                          className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Campaign Media</CardTitle>
                  <CardDescription>Upload images and add video to showcase your campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <MediaUpload
                    type="image"
                    title="Main Campaign Image *"
                    description="This will be the primary image shown on your campaign page"
                    maxSize={10 * 1024 * 1024}
                    enableCompression={true}
                    showPreview={true}
                    initialFiles={campaignData.media.mainImageUrl ? [campaignData.media.mainImageUrl] : []}
                    onFilesChange={handleMainImageChange}
                    onError={handleMediaError}
                  />

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
                    initialFiles={campaignData.media.galleryUrls}
                    onFilesChange={handleGalleryChange}
                    onError={handleMediaError}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl" className="text-base font-semibold">
                        Campaign Video (YouTube)
                      </Label>
                      <p className="text-sm text-muted-foreground">Add a YouTube video to showcase your campaign</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtubeUrl">YouTube URL</Label>
                      <Input
                        id="youtubeUrl"
                        type="url"
                        value={campaignData.media.youtubeUrl}
                        onChange={(e) =>
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              media: { ...prev.media, youtubeUrl: e.target.value },
                            }
                          })
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                      />
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
                  <CardTitle>Funding Goals</CardTitle>
                  <CardDescription>Update your funding target and timeline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="goal">Funding Goal (USD) *</Label>
                      <Input
                        id="goal"
                        type="number"
                        value={campaignData.funding.goal === 0 ? "" : campaignData.funding.goal}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : Number(e.target.value)
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              funding: { ...prev.funding, goal: value },
                            }
                          })
                        }}
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
                              setCampaignData((prev) => {
                                if (!prev) return prev
                                return {
                                  ...prev,
                                  funding: { ...prev.funding, endDate: date },
                                }
                              })
                              if (date) {
                                setIsEndDateOpen(false)
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minPledge">Minimum Pledge (USD)</Label>
                      <Input
                        id="minPledge"
                        type="number"
                        value={campaignData.funding.minPledge === 0 ? "" : campaignData.funding.minPledge}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : Number(e.target.value)
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              funding: { ...prev.funding, minPledge: value },
                            }
                          })
                        }}
                        className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={campaignData.funding.currency}
                        onValueChange={(value) =>
                          setCampaignData((prev) => {
                            if (!prev) return prev
                            return {
                              ...prev,
                              funding: { ...prev.funding, currency: value },
                            }
                          })
                        }
                      >
                        <SelectTrigger className="border-2 border-border bg-zinc-800">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tiers" className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reward Tiers</CardTitle>
                      <CardDescription>Manage reward tiers for your backers</CardDescription>
                    </div>
                    <Button onClick={addRewardTier} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {campaignData.rewards.map((tier, index) => (
                      <Card key={tier.id} className="border-2 border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg">Reward Tier</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => deleteRewardTier(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Title *</Label>
                              <Input
                                value={tier.title}
                                onChange={(e) => updateRewardTier(index, { ...tier, title: e.target.value })}
                                placeholder="Early Bird Special"
                                className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Amount (USD) *</Label>
                              <Input
                                type="number"
                                value={tier.amount === 0 ? "" : tier.amount}
                                onChange={(e) => updateRewardTier(index, { ...tier, amount: Number(e.target.value) })}
                                placeholder="25"
                                className="border-2 border-border bg-zinc-800 focus:border-primary focus:bg-background"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description *</Label>
                            <RichEditor
                              content={tier.description}
                              onChange={(content) => updateRewardTier(index, { ...tier, description: content })}
                              placeholder="What backers will receive for this pledge amount"
                              className="min-h-[120px] border-2 border-border bg-zinc-800 focus-within:border-primary focus-within:bg-background"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {campaignData.rewards.length === 0 && (
                      <Card className="border-dashed border-2">
                        <CardContent className="pt-6 text-center">
                          <h3 className="text-lg font-semibold mb-2">No reward tiers yet</h3>
                          <p className="text-muted-foreground mb-4">Create reward tiers to incentivize backers</p>
                          <Button onClick={addRewardTier} className="bg-primary hover:bg-primary/90">
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
        </div>
      </div>
    </div>
  )
}
