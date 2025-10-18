"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"
import { getCampaigns } from "@/lib/actions/campaigns"
import Link from "next/link"

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

const CATEGORIES = ["Gaming", "Art", "Technology", "Music", "VTuber"]

export function CategoryRail() {
  const [campaignsByCategory, setCampaignsByCategory] = useState<Record<string, Campaign[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const categoryData: Record<string, Campaign[]> = {}

        for (const category of CATEGORIES) {
          const data = await getCampaigns({
            category: category.toLowerCase(),
            status: "ACTIVE",
            limit: 3,
          })

          categoryData[category] = data.map((c: any) => ({
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
        }

        setCampaignsByCategory(categoryData)
      } catch (error) {
        console.error("[v0] Failed to load category campaigns:", error)
        setCampaignsByCategory({})
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
          <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
          {CATEGORIES.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-4">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-96 bg-gray-900 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const hasAnyCampaigns = Object.values(campaignsByCategory).some((campaigns) => campaigns.length > 0)
  if (!hasAnyCampaigns) {
    return null
  }

  return (
    <section className="py-8 bg-gray-950">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
        {CATEGORIES.map((category) => {
          const campaigns = campaignsByCategory[category] || []
          if (campaigns.length === 0) return null

          return (
            <div key={category} className="mb-12 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{category}</h3>
                <Link
                  href={`/campaigns?category=${category.toLowerCase()}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  See all {category} →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.slice(0, 3).map((campaign) => (
                  <CampaignCard key={campaign.id} {...campaign} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
