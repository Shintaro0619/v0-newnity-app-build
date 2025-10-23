"use client"

import { useAccount } from "wagmi"
import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, Users, Heart, Target, Award, Plus, Clock, AlertCircle, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { getCampaignsByCreator, getCampaignsByBacker, getUserPledgeStats } from "@/lib/actions/campaigns"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import RequireWallet from "@/components/guards/require-wallet"

interface Pledge {
  id: string
  amount: number
  campaignId: string
  campaignTitle: string
  campaignImage: string
  tier: string
  createdAt: string
  status: "active" | "completed" | "cancelled"
}

interface Campaign {
  id: string
  title: string
  description: string
  cover_image: string
  goal_amount: number
  raised_amount: number
  backers_count: number
  end_date: string
  status: string
  created_at: string
  blockchain_campaign_id: number | null
  myPledgeAmount?: number
}

interface DashboardStats {
  totalPledged: number
  totalCampaigns: number
  totalBacked: number
  successRate: number
}

const mockPledges: Pledge[] = [
  {
    id: "1",
    amount: 50,
    campaignId: "1",
    campaignTitle: "Revolutionary VR Headset",
    campaignImage: "/vr-headset.jpg",
    tier: "Early Bird",
    createdAt: "2024-01-15",
    status: "active",
  },
  {
    id: "2",
    amount: 100,
    campaignId: "2",
    campaignTitle: "Sustainable Water Bottle",
    campaignImage: "/reusable-water-bottle.png",
    tier: "Premium",
    createdAt: "2024-01-10",
    status: "completed",
  },
]

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Smart Home Assistant",
    description: "AI-powered home automation system",
    cover_image: "/smart-home-device.png",
    goal_amount: 50000,
    raised_amount: 32500,
    backers_count: 156,
    end_date: "2024-02-23",
    status: "ACTIVE",
    created_at: "2024-01-01",
    blockchain_campaign_id: 1,
  },
]

const chartData = [
  { month: "Jan", pledged: 120, campaigns: 2 },
  { month: "Feb", pledged: 250, campaigns: 3 },
  { month: "Mar", pledged: 180, campaigns: 1 },
  { month: "Apr", pledged: 320, campaigns: 4 },
  { month: "May", pledged: 450, campaigns: 2 },
  { month: "Jun", pledged: 380, campaigns: 3 },
]

const pieData = [
  { name: "Technology", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Design", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Games", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Other", value: 10, color: "hsl(var(--chart-4))" },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const searchParams = useSearchParams()
  const newCampaignId = searchParams.get("newCampaign")
  const campaignSectionRef = useRef<HTMLDivElement>(null)
  const [pledges, setPledges] = useState<Pledge[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [backedCampaigns, setBackedCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalPledged: 0,
    totalCampaigns: 0,
    totalBacked: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (newCampaignId && !loading) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }, 100)
    }
  }, [newCampaignId, loading])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [campaignData, backedData, pledgeStats] = await Promise.all([
        getCampaignsByCreator(address!),
        getCampaignsByBacker(address!),
        getUserPledgeStats(address!),
      ])

      console.log("[v0] Dashboard campaigns loaded:", campaignData)
      console.log("[v0] Backed campaigns loaded:", backedData)
      console.log("[v0] Pledge stats loaded:", pledgeStats)

      setCampaigns(campaignData as any)
      setBackedCampaigns(backedData as any)

      // Calculate stats
      const totalCampaigns = campaignData.length
      const activeCampaigns = campaignData.filter((c: any) => c.status === "ACTIVE").length

      setStats({
        totalPledged: pledgeStats.totalPledged,
        totalCampaigns,
        totalBacked: pledgeStats.totalBacked,
        successRate: totalCampaigns > 0 ? (activeCampaigns / totalCampaigns) * 100 : 0,
      })
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  function getDaysLeft(endDate: string): number {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function isDeadlinePassed(endDate: string): boolean {
    const end = new Date(endDate)
    const now = new Date()
    return now.getTime() > end.getTime()
  }

  function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "SUCCESSFUL":
        return "default"
      case "FAILED":
        return "destructive"
      case "DRAFT":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <RequireWallet>
      {loading ? (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 pt-24">
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 pt-24 pb-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback className="text-lg">{address?.slice(2, 4).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
                  <p className="text-muted-foreground">Manage your campaigns and track your backing activity</p>
                </div>
              </div>
              <Button asChild>
                <Link href="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Campaign
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pledged</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${formatCurrency(stats.totalPledged)}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campaigns Created</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">2 active campaigns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projects Backed</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalBacked}</div>
                  <p className="text-xs text-muted-foreground">Across 8 categories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{formatPercentage(stats.successRate)}%</div>
                  <p className="text-xs text-muted-foreground">Above platform average</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card ref={campaignSectionRef}>
              <CardHeader>
                <CardTitle>My Campaigns</CardTitle>
                <CardDescription>Campaigns you've created and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first campaign to get started</p>
                    <Button asChild>
                      <Link href="/create">Start Campaign</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {campaigns.map((campaign) => {
                      const daysLeft = getDaysLeft(campaign.end_date)
                      const progressPercentage = (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100
                      const isDraft = campaign.status === "DRAFT"
                      const isNotDeployed = !campaign.blockchain_campaign_id
                      const deadlinePassed = isDeadlinePassed(campaign.end_date)
                      const canFinalize = deadlinePassed && campaign.status === "ACTIVE"
                      const isFunded = campaign.status === "SUCCESSFUL"
                      const isFailed = campaign.status === "FAILED"

                      return (
                        <div
                          key={campaign.id}
                          className="border-2 border-zinc-700 dark:border-zinc-600 rounded-lg p-6 shadow-sm"
                        >
                          {isDraft && isNotDeployed && (
                            <div className="w-full rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-amber-900 dark:text-amber-100">Campaign not live</p>
                                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-normal break-words">
                                    This campaign is saved as a draft. Deploy it to the blockchain to make it live and
                                    start accepting pledges.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {canFinalize && (
                            <div
                              data-action-required
                              className="mb-4 rounded-md border border-blue-500 bg-blue-50 dark:bg-blue-950 p-4"
                            >
                              <div className="content flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-col flex-1 min-w-0 w-full">
                                  <p className="block whitespace-normal break-words text-pretty leading-relaxed text-sm text-blue-900 dark:text-blue-100">
                                    <strong>Action Required:</strong> This campaign has reached its deadline. Click
                                    "View Campaign" to finalize it.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {isFunded && (
                            <div
                              data-action-required
                              className="mb-4 rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-4"
                            >
                              <div className="content flex items-start gap-3">
                                <span className="text-lg shrink-0">✅</span>
                                <div className="text-col flex-1 min-w-0 w-full">
                                  <p className="block whitespace-normal break-words text-pretty leading-relaxed text-sm text-green-900 dark:text-green-100">
                                    <strong>Campaign Successful!</strong> Funds have been automatically released to your
                                    wallet.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex space-x-4">
                              <img
                                src={campaign.cover_image || "/placeholder.svg?height=80&width=80"}
                                alt={campaign.title}
                                className="h-20 w-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="text-xl font-semibold">{campaign.title}</h3>
                                <p className="text-muted-foreground line-clamp-2">{campaign.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <span className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
                                    <Users className="h-4 w-4 mr-1" />
                                    {campaign.backers_count} backers
                                  </span>
                                  <span className="flex items-center text-orange-600 dark:text-orange-400 font-medium">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {deadlinePassed ? "Ended" : `${daysLeft} days left`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                              {isDraft && isNotDeployed && (
                                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                                  Not Deployed
                                </Badge>
                              )}
                              {canFinalize && (
                                <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                  Needs Finalize
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ${formatCurrency(Number(campaign.raised_amount))} raised
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                ${formatCurrency(Number(campaign.goal_amount))} goal
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% funded</p>
                          </div>

                          <div className="flex justify-end space-x-2 mt-4">
                            {isDraft && isNotDeployed ? (
                              <>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/campaigns/${campaign.id}/edit`}>Edit Campaign</Link>
                                </Button>
                                <Button size="sm" asChild className="bg-primary">
                                  <Link href={`/campaigns/${campaign.id}`}>
                                    <span className="mr-1">🚀</span>
                                    View & Deploy
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/campaigns/${campaign.id}`}>
                                  {canFinalize ? "Finalize Campaign" : "View Campaign"}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Backed Campaigns Section */}
            {backedCampaigns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projects I've Backed</CardTitle>
                  <CardDescription>Campaigns you're supporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {backedCampaigns.map((campaign: any) => {
                      const daysLeft = getDaysLeft(campaign.end_date)
                      const progressPercentage = (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100
                      const deadlinePassed = isDeadlinePassed(campaign.end_date)
                      const isFailed = campaign.status === "FAILED"
                      const canClaimRefund = isFailed && deadlinePassed

                      return (
                        <div
                          key={campaign.id}
                          className="border-2 border-zinc-700 dark:border-zinc-600 rounded-lg p-6 shadow-sm"
                        >
                          {canClaimRefund && (
                            <div
                              data-action-required
                              className="mb-4 rounded-md border border-orange-500 bg-orange-50 dark:bg-orange-950 p-4"
                            >
                              <div className="content flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                <div className="text-col flex-1 min-w-0 w-full">
                                  <p className="block whitespace-normal break-words text-pretty leading-relaxed text-sm text-orange-900 dark:text-orange-100">
                                    <strong>Refund Available:</strong> This campaign did not reach its goal. You can
                                    claim your refund.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex space-x-4">
                              <img
                                src={campaign.cover_image || "/placeholder.svg?height=80&width=80"}
                                alt={campaign.title}
                                className="h-20 w-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="text-xl font-semibold">{campaign.title}</h3>
                                <p className="text-muted-foreground line-clamp-2">{campaign.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <span className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
                                    <Users className="h-4 w-4 mr-1" />
                                    {campaign.backers_count} backers
                                  </span>
                                  <span className="flex items-center text-orange-600 dark:text-orange-400 font-medium">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {deadlinePassed ? "Ended" : `${daysLeft} days left`}
                                  </span>
                                  <span className="flex items-center font-medium text-pink-600 dark:text-pink-400">
                                    <Heart className="h-4 w-4 mr-1 fill-current" />
                                    You pledged ${formatCurrency(Number(campaign.myPledgeAmount || 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                              {canClaimRefund && (
                                <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                                  Refund Available
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ${formatCurrency(Number(campaign.raised_amount))} raised
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                ${formatCurrency(Number(campaign.goal_amount))} goal
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% funded</p>
                          </div>

                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/campaigns/${campaign.id}`}>
                                {canClaimRefund ? "Claim Refund" : "View Campaign"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </RequireWallet>
  )
}
