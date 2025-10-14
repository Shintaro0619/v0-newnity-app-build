"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface CampaignFiltersProps {
  onFilterChange: (filters: {
    category?: string
    status?: string
    search?: string
    sortBy?: string
  }) => void
  initialSearch?: string
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "games", label: "Games" },
  { value: "music", label: "Music" },
  { value: "film", label: "Film & Video" },
  { value: "art", label: "Art" },
  { value: "design", label: "Design" },
  { value: "food", label: "Food" },
  { value: "fashion", label: "Fashion" },
]

const STATUSES = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "FUNDED", label: "Funded" },
  { value: "FAILED", label: "Failed" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "most_funded", label: "Most Funded" },
  { value: "most_backers", label: "Most Backers" },
]

export function CampaignFilters({ onFilterChange, initialSearch = "" }: CampaignFiltersProps) {
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("ACTIVE")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    if (initialSearch !== search) {
      setSearch(initialSearch)
    }
  }, [initialSearch])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({ search: value, category, status, sortBy })
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    onFilterChange({ search, category: value, status, sortBy })
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onFilterChange({ search, category, status: value, sortBy })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    onFilterChange({ search, category, status, sortBy: value })
  }

  const activeFiltersCount = [category !== "all", status !== "ACTIVE", search !== ""].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative lg:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-800 text-white"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex items-center gap-3">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px] bg-gray-900 border-gray-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFiltersCount} active
          </Badge>
        )}
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden flex items-center gap-3">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="flex-1 bg-gray-900 border-gray-800 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Filter campaigns by category and status</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
