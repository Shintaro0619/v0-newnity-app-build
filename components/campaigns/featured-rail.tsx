"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"
import { getCampaigns } from "@/lib/actions/campaigns"

interface Campaign {
  id: string // Changed from number to string to match database ID type
  title: string
  creator: string
  image: string
  raised: number
  goal: number
  backers: number
  category: string
  daysLeft: number
  status: "live" | "upcoming" | "funded"
  blockchainCampaignId?: number // Added blockchain campaign ID
}

export function FeaturedRail() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getCampaigns({ status: "ACTIVE", limit: 3 })

        const transformed = data.map((c: any) => ({
          id: c.id, // Use database ID (string)
          title: c.title,
          creator: c.creator_name || "Anonymous",
          image: c.cover_image || "/placeholder.svg?height=400&width=600",
          raised: c.raised_amount || 0,
          goal: c.goal_amount,
          backers: Number.parseInt(c.backers_count) || 0,
          category: c.category,
          daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          status: "live" as const,
          blockchainCampaignId: c.blockchain_campaign_id, // Pass blockchain ID if it exists
        }))

        setCampaigns(transformed)
      } catch (error) {
        console.error("[v0] Failed to load campaigns:", error)
        setCampaigns([
          {
            id: "fallback-1",
            title: "Cyber Legends: Next-Gen Trading Card Game",
            creator: "PixelForge Studios",
            image: "/cyberpunk-trading-card-game.jpg",
            raised: 187500,
            goal: 250000,
            backers: 1247,
            category: "Game",
            daysLeft: 12,
            status: "live",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>
      </div>
    </section>
  )
}
