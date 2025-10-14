"use client"

import { useEffect, useState } from "react"
import { CampaignCard } from "./campaign-card"
import { CampaignFilters } from "./campaign-filters"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Campaign {
  id: string
  title: string
  description: string
  goal_amount: number
  raised_amount: number
  category: string
  cover_image: string
  end_date: string
  status: string
  blockchain_campaign_id?: number
  creator_name: string
  backers_count: number
}

export function CampaignGrid() {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get("search") || ""

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: "all",
    status: "ACTIVE",
    search: urlSearch,
    sortBy: "newest",
  })

  useEffect(() => {
    if (urlSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: urlSearch }))
    }
  }, [urlSearch])

  useEffect(() => {
    fetchCampaigns()
  }, [filters])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.search) params.append("search", filters.search)

      const response = await fetch(`/api/campaigns?${params.toString()}`)
      const data = await response.json()

      const sortedCampaigns = data.campaigns || []

      // Apply sorting
      switch (filters.sortBy) {
        case "ending_soon":
          sortedCampaigns.sort(
            (a: Campaign, b: Campaign) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
          )
          break
        case "most_funded":
          sortedCampaigns.sort(
            (a: Campaign, b: Campaign) => b.raised_amount / b.goal_amount - a.raised_amount / a.goal_amount,
          )
          break
        case "most_backers":
          sortedCampaigns.sort((a: Campaign, b: Campaign) => (b.backers_count || 0) - (a.backers_count || 0))
          break
        default: // newest
          // Already sorted by created_at DESC from API
          break
      }

      setCampaigns(sortedCampaigns)
    } catch (error) {
      console.error("[v0] Error fetching campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysLeft = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="space-y-6">
      {filters.search && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Searching for:</span>
          <span className="text-white font-medium">&quot;{filters.search}&quot;</span>
        </div>
      )}

      <CampaignFilters onFilterChange={setFilters} initialSearch={urlSearch} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No campaigns found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.title}
                creator={campaign.creator_name || "Anonymous"}
                image={campaign.cover_image}
                raised={campaign.raised_amount}
                goal={campaign.goal_amount}
                backers={campaign.backers_count}
                category={campaign.category}
                daysLeft={calculateDaysLeft(campaign.end_date)}
                status="live"
                blockchainCampaignId={campaign.blockchain_campaign_id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
