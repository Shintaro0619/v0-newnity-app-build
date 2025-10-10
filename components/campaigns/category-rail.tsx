"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"
import Link from "next/link"

interface Campaign {
  id: number
  title: string
  creator: string
  image: string
  raised: number
  goal: number
  backers: number
  category: string
  status: "live" | "upcoming" | "funded"
}

const CATEGORIES = ["Gaming", "Art", "Technology", "Music", "VTuber"]

export function CategoryRail() {
  const [campaignsByCategory, setCampaignsByCategory] = useState<Record<string, Campaign[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock API call - replace with actual API: GET /api/categories then GET /api/campaigns?category=xxx&limit=8
    const mockData: Record<string, Campaign[]> = {}
    CATEGORIES.forEach((category, catIndex) => {
      mockData[category] = Array.from({ length: 8 }).map((_, i) => ({
        id: 300 + catIndex * 10 + i,
        title: `${category} Project #${i + 1}`,
        creator: `${category} Creator ${i + 1}`,
        image: `/placeholder.svg?height=400&width=640&query=${category.toLowerCase()}-campaign-${i + 1}`,
        raised: Math.floor(Math.random() * 300000) + 50000,
        goal: 400000,
        backers: Math.floor(Math.random() * 1000) + 100,
        category,
        status: "live",
      }))
    })
    setCampaignsByCategory(mockData)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <section className="py-8 bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
          {CATEGORIES.map((category) => (
            <div key={category} className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-4">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-96 bg-gray-900 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-gray-950">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
        {CATEGORIES.map((category) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {campaignsByCategory[category]?.slice(0, 4).map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
