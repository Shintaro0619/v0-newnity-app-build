"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"
import { getCampaigns } from "@/lib/actions/campaigns"

interface Campaign {
  id: string
  title: string
  creator: string
  image: string
  raised: number
  goal: number
  backers: number
  category: string
  daysLeft: number
  status: "live" | "upcoming" | "funded"
  blockchainCampaignId?: number
}

export function NewRail() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getCampaigns({
          status: "ACTIVE",
          limit: 6,
          sortBy: "created_at",
          sortOrder: "desc",
        })

        const transformed = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          creator: c.creator_name || "Anonymous",
          image: c.cover_image || "/placeholder.svg?height=400&width=600",
          raised: c.raised_amount || 0,
          goal: c.goal_amount,
          backers: Number.parseInt(c.backers_count) || 0,
          category: c.category,
          daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
          status: "live" as const,
          blockchainCampaignId: c.blockchain_campaign_id,
        }))

        setCampaigns(transformed)
      } catch (error) {
        console.error("[v0] Failed to load new campaigns:", error)
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  if (loading) {
    return (
      <section className="py-8 bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">New Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (campaigns.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-gray-950">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-4">New Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>
      </div>
    </section>
  )
}
