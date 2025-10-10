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

export function NewRail() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: 101,
        title: "Indie RPG: Chronicles of the Lost Kingdom",
        creator: "Moonlight Games",
        image: "/fantasy-rpg-game-medieval-castle.jpg",
        raised: 45200,
        goal: 100000,
        backers: 312,
        category: "Game",
        daysLeft: 25,
        status: "live",
      },
      {
        id: 102,
        title: "Digital Art Collection: Neon Dreams",
        creator: "CryptoArtist",
        image: "/neon-digital-art-cyberpunk-abstract.jpg",
        raised: 28900,
        goal: 50000,
        backers: 187,
        category: "Digital",
        daysLeft: 18,
        status: "live",
      },
      {
        id: 103,
        title: "Smart Home IoT Hub",
        creator: "TechNova",
        image: "/smart-home-device-modern-technology.jpg",
        raised: 67800,
        goal: 80000,
        backers: 445,
        category: "Tech",
        daysLeft: 22,
        status: "live",
      },
      {
        id: 104,
        title: "Anime Music Video Project",
        creator: "Studio Harmony",
        image: "/anime-music-studio-recording.jpg",
        raised: 34500,
        goal: 60000,
        backers: 256,
        category: "Music",
        daysLeft: 20,
        status: "live",
      },
      {
        id: 105,
        title: "VTuber Debut Support Project",
        creator: "Virtual Stars Agency",
        image: "/vtuber-avatar-streaming-setup.jpg",
        raised: 52100,
        goal: 75000,
        backers: 389,
        category: "Social",
        daysLeft: 14,
        status: "live",
      },
      {
        id: 106,
        title: "Blockchain Gaming Platform",
        creator: "Web3 Gaming DAO",
        image: "/blockchain-gaming-cryptocurrency-nft.jpg",
        raised: 89400,
        goal: 120000,
        backers: 567,
        category: "Web3",
        daysLeft: 16,
        status: "live",
      },
    ]
    setCampaigns(mockCampaigns)
    setLoading(false)
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
