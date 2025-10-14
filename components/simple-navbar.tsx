"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const WalletButton = dynamic(() => import("@/components/wallet-button"), { ssr: false })

export function SimpleNavbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowMobileSearch(false)
    }
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-primary/20 bg-black/80 backdrop-blur-nav supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BrandMark size={32} />
          <span className="font-bold text-xl">
            <span className="text-white">new</span>
            <span className="text-primary">nity</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-2xl mx-8">
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                Home
              </Button>
            </Link>

            <Link href="/create">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                Create
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                Dashboard
              </Button>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </form>
        </div>

        <div className="flex lg:hidden items-center space-x-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Home
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-300 hover:text-white hover:bg-gray-900"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>

          <WalletButton />
        </div>
      </div>

      {showMobileSearch && (
        <div className="lg:hidden border-t border-primary/20 bg-black/90 backdrop-blur-nav">
          <div className="container py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
