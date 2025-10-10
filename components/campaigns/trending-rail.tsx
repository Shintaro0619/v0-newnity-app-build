"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"

interface Campaign {
  id: number
  title: string
  creator: string
  image: string
  raised: number
  goal: number
  backers: number
  category: string
  daysLeft: number
  status: "live" | "upcoming" | "funded"
}

export function TrendingRail() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: 201,
        title: "Revolutionary VR Gaming Experience",
        creator: "NextGen VR Studios",
        image: "/virtual-reality-gaming-headset-futuristic.jpg",
        raised: 456700,
        goal: 500000,
        backers: 2834,
        category: "Game",
        daysLeft: 9,
        status: "live",
      },
      {
        id: 202,
        title: "Sustainable Tech Gadget",
        creator: "EcoTech Innovations",
        image: "/eco-friendly-technology-sustainable-gadget.jpg",
        raised: 298500,
        goal: 300000,
        backers: 1923,
        category: "Tech",
        daysLeft: 11,
        status: "live",
      },
      {
        id: 203,
        title: "Indie Film: Tokyo Nights",
        creator: "Independent Cinema Collective",
        image: "/tokyo-night-cityscape-cinematic-neon.jpg",
        raised: 187300,
        goal: 200000,
        backers: 1456,
        category: "Film",
        daysLeft: 7,
        status: "live",
      },
    ]
    setCampaigns(mockCampaigns)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Trending</h2>
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
        <h2 className="text-2xl font-bold text-white mb-4">Trending</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} {...campaign} />
          ))}
        </div>
      </div>
    </section>
  )
}
