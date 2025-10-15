import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Globe, Calendar, Users, Target, Clock } from "lucide-react"
import Link from "next/link"
import { getCampaignsByCreator } from "@/lib/actions/campaigns"

interface PageProps {
  params: Promise<{ address: string }>
}

async function getUserProfile(address: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users/${address}`,
      {
        cache: "no-store",
      },
    )
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "FUNDED":
      return "default"
    case "FAILED":
      return "destructive"
    case "DRAFT":
      return "secondary"
    default:
      return "outline"
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params
  const [userProfile, campaigns] = await Promise.all([getUserProfile(address), getCampaignsByCreator(address)])

  if (!userProfile) {
    notFound()
  }

  const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE")
  const totalRaised = campaigns.reduce((sum: number, c: any) => sum + Number(c.raised_amount || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
                <AvatarFallback className="text-2xl">
                  {userProfile.name?.charAt(0) || userProfile.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{userProfile.name || "Anonymous User"}</h1>
                <p className="text-muted-foreground mb-4">{userProfile.bio || "No bio yet"}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {userProfile.website && (
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  )}
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">${totalRaised.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Campaigns</h2>
              <p className="text-muted-foreground">Projects created by this user</p>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground">This user hasn't created any campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: any) => {
                const daysLeft = getDaysLeft(campaign.end_date)
                const progressPercentage = (Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100

                return (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <img
                          src={campaign.cover_image || "/placeholder.svg?height=200&width=400"}
                          alt={campaign.title}
                          className="object-cover w-full h-full"
                        />
                        <Badge className="absolute top-2 right-2" variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">${Number(campaign.raised_amount).toLocaleString()}</span>
                              <span className="text-muted-foreground">
                                ${Number(campaign.goal_amount).toLocaleString()}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% funded</p>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {campaign.backers_count || 0}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {daysLeft} days left
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
