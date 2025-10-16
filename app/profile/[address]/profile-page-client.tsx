"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Globe, Calendar, Users, Target, Clock, Settings } from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"

interface ProfilePageClientProps {
  userProfile: any
  campaigns: any[]
  address: string
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

export function ProfilePageClient({ userProfile, campaigns, address }: ProfilePageClientProps) {
  const { address: connectedAddress } = useAccount()
  const isOwnProfile = connectedAddress?.toLowerCase() === address.toLowerCase()

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl">{address.charAt(2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-2">Profile Not Set Up</h2>
              <p className="text-muted-foreground mb-2">
                {isOwnProfile ? "You haven't set up your profile yet." : "This user hasn't set up their profile yet."}
              </p>
              <p className="text-sm text-muted-foreground mb-6 font-mono break-all px-4">{address}</p>
              {isOwnProfile && (
                <Button asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Set Up Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalRaised = campaigns.reduce((sum: number, c: any) => sum + Number(c.raised_amount || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 flex-shrink-0">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
                <AvatarFallback className="text-2xl">
                  {userProfile.name?.charAt(0) || userProfile.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left w-full">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{userProfile.name || "Anonymous User"}</h1>
                <p className="text-muted-foreground mb-4">{userProfile.bio || "No bio yet"}</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-sm text-muted-foreground">
                  {userProfile.website && (
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Website</span>
                    </a>
                  )}
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Joined </span>
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto items-center md:items-end">
                <div className="text-center md:text-right">
                  <div className="text-2xl md:text-3xl font-bold text-primary">${totalRaised.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                </div>
                {isOwnProfile && (
                  <Button variant="outline" size="sm" asChild className="w-full md:w-auto bg-transparent">
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                )}
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
