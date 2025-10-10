"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { AuthButton } from "@/components/auth-button"

export function Navbar() {
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

        <div className="hidden md:flex items-center space-x-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Features
            </Button>
          </Link>

          <Link href="/campaigns">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              How It Works
            </Button>
          </Link>

          <Link href="/about">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              About
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
              Contact
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <WalletConnectButton />
          <AuthButton />

          <Link href="/create">
            <Button className="bg-primary hover:bg-primary/90 text-black font-bold glow-primary">Get Involved</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
