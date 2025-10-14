"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function WalletButton() {
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

  if (!isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90 text-black font-bold glow-primary" disabled={isConnecting}>
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
    )
  }

  return (
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
        <DropdownMenuItem onClick={() => disconnect()} className="text-red-400 hover:bg-gray-800 cursor-pointer">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
