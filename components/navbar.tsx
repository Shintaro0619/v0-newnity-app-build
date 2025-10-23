"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { subscribeToConnecting } from "@/components/wallet-connect-button"
import { AuthButton } from "@/components/auth-button"
import { useAccount } from "wagmi"

const WalletConnectButton = dynamic(
  () => import("@/components/wallet-connect-button").then((mod) => ({ default: mod.WalletConnectButton })),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    ),
  },
)

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isWalletConnecting, setIsWalletConnecting] = useState(false)
  const router = useRouter()
  const { isConnected, address } = useAccount()

  useEffect(() => {
    const unsubscribe = subscribeToConnecting(setIsWalletConnecting)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    console.log("[v0] [NAVBAR] Wallet connection state:", { isConnected, address })
  }, [isConnected, address])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowMobileSearch(false)
    }
  }

  const handleDiscoverClick = () => {
    setSearchQuery("")
    window.location.href = "/discover"
  }

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b border-primary/20 bg-black/80 backdrop-blur-nav supports-[backdrop-filter]:bg-black/60`}
    >
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
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-900"
              onClick={handleDiscoverClick}
            >
              Discover
            </Button>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                Dashboard
              </Button>
            </Link>

            <Link href="/about">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                About
              </Button>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
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
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-900"
            onClick={handleDiscoverClick}
          >
            Discover
          </Button>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-3 relative z-[100]">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-300 hover:text-white hover:bg-gray-900"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            {showMobileSearch ? "✕" : "🔍"}
          </Button>

          {isConnected && address && <AuthButton />}

          {!isConnected && <WalletConnectButton />}

          <Link href="/create">
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold glow-primary">Start Campaign</Button>
          </Link>
        </div>
      </div>

      {showMobileSearch && (
        <div className="lg:hidden border-t border-primary/20 bg-black/90 backdrop-blur-nav">
          <div className="container py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
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
