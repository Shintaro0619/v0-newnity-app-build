"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grid3x3, LayoutGrid, Monitor, Gamepad2, Users, Music, Cog, Film, Code } from "lucide-react"

interface CategoryItem {
  id: string
  name: string
  count: number
  icon: React.ReactNode
}

const categories: CategoryItem[] = [
  { id: "all", name: "All", count: 1247, icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "digital", name: "Digital", count: 324, icon: <Monitor className="w-4 h-4" /> },
  { id: "web3", name: "Web3", count: 189, icon: <Grid3x3 className="w-4 h-4" /> },
  { id: "game", name: "Games", count: 456, icon: <Gamepad2 className="w-4 h-4" /> },
  { id: "boardgame", name: "Board Games", count: 78, icon: <Grid3x3 className="w-4 h-4" /> },
  { id: "music", name: "Music", count: 156, icon: <Music className="w-4 h-4" /> },
  { id: "tech", name: "Tech", count: 234, icon: <Cog className="w-4 h-4" /> },
  { id: "social", name: "Social", count: 67, icon: <Users className="w-4 h-4" /> },
  { id: "film", name: "Film", count: 45, icon: <Film className="w-4 h-4" /> },
  { id: "software", name: "Software", count: 123, icon: <Code className="w-4 h-4" /> },
]

export function CampaignSidebar() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [fundingStatus, setFundingStatus] = useState("all")

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className={`w-full justify-start text-sm font-normal ${
                  selectedCategory === category.id
                    ? "bg-primary text-black hover:bg-primary/90"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-2">{category.icon}</span>
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-xs opacity-70">{category.count}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Funding Status</label>
              <Select value={fundingStatus} onValueChange={setFundingStatus}>
                <SelectTrigger className="w-full bg-gray-900 border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="success">Successful</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Sort By</label>
              <Select defaultValue="popular">
                <SelectTrigger className="w-full bg-gray-900 border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                  <SelectItem value="funded">Funding %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
