"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function SimpleNavbar() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (connector: any) => {
    setIsConnecting(true)
    try {
      await connect({ connector })
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
    } finally {
      setIsConnecting(false)
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

          {isConnected && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-black font-bold glow-primary"
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Get Involved"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                {connectors.map((connector) => (
                  <DropdownMenuItem
                    key={connector.id}
                    onClick={() => handleConnect(connector)}
                    className="text-white hover:bg-gray-800 cursor-pointer"
                  >
                    Connect with {connector.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-black font-bold">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/create" className="cursor-pointer">
                    Create Campaign
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/test" className="cursor-pointer">
                    Get Test USDC
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => disconnect()}
                  className="text-red-400 hover:bg-gray-800 cursor-pointer"
                >
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  )
}
