"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCampaigns } from "@/lib/actions/campaigns"

interface Campaign {
  id: string
  title: string
  description: string
  goal_amount: number
  raised_amount: number
  backers_count: number
  status: string
  category: string
  creator_name: string
  creator_avatar: string
  cover_image: string
  end_date: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    loadCampaigns()
  }, [categoryFilter])

  async function loadCampaigns() {
    setLoading(true)
    try {
      const data = await getCampaigns({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: "ACTIVE",
        limit: 50,
      })
      setCampaigns(data as any)
    } catch (error) {
      console.error("[v0] Error loading campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  function getDaysLeft(endDate: string): number {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-4">Discover Campaigns</h1>
          <p className="text-muted-foreground">Support creators with USDC on Base blockchain</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Art">Art</SelectItem>
              <SelectItem value="VTuber">VTuber</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Film">Film</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
            const progressPercentage = (campaign.raised_amount / campaign.goal_amount) * 100
            const daysLeft = getDaysLeft(campaign.end_date)

            return (
              <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={campaign.cover_image || "/placeholder.svg?height=400&width=600"}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{campaign.category}</Badge>
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>{campaign.status}</Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <img
                      src={campaign.creator_avatar || "/placeholder.svg?height=20&width=20"}
                      alt={campaign.creator_name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>by {campaign.creator_name}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">${campaign.raised_amount.toLocaleString()} USDC</span>
                      <span className="text-sm text-muted-foreground">of ${campaign.goal_amount.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{campaign.backers_count} backers</span>
                      <span>{daysLeft} days left</span>
                    </div>
                  </div>

                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button className="w-full">View Campaign</Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">
              {campaigns.length === 0
                ? "Be the first to create a campaign!"
                : "Try adjusting your search or filter criteria"}
            </p>
            {campaigns.length === 0 && (
              <Link href="/create">
                <Button className="mt-4">Create Campaign</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
