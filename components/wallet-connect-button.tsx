"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

let globalIsConnecting = false
const connectingListeners = new Set<(isConnecting: boolean) => void>()

export function subscribeToConnecting(listener: (isConnecting: boolean) => void) {
  connectingListeners.add(listener)
  return () => connectingListeners.delete(listener)
}

function setGlobalConnecting(isConnecting: boolean) {
  globalIsConnecting = isConnecting
  connectingListeners.forEach((listener) => listener(isConnecting))
}

export function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setGlobalConnecting(isConnecting)
  }, [isConnecting])

  useEffect(() => {
    console.log(
      "[v0] Available wallet connectors:",
      connectors.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    )
  }, [connectors])

  useEffect(() => {
    console.log("[v0] Wallet connection state:", {
      isConnected,
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "none",
    })
  }, [isConnected, address])

  useEffect(() => {
    if (connectError) {
      console.error("[v0] Wallet connection error:", connectError)
      toast({
        title: "Connection Failed",
        description: connectError.message || "Failed to connect wallet",
        variant: "destructive",
      })
      setIsConnecting(false)
    }
  }, [connectError, toast])

  useEffect(() => {
    if (isConnected && isConnecting) {
      console.log("[v0] Wallet connected successfully:", address)
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address?.slice(0, 6)}...${address?.slice(-4)}`,
      })
      setIsConnecting(false)
    }
  }, [isConnected, isConnecting, address, toast])

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <Button
          onClick={() => {
            console.log("[v0] Disconnecting wallet")
            disconnect()
          }}
          variant="outline"
          size="sm"
          className="text-gray-300 border-gray-700 hover:bg-gray-900"
        >
          <span className="mr-2">🚪</span>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-300 border-gray-700 hover:bg-gray-900 bg-transparent"
          disabled={isConnecting}
        >
          <span className="mr-2">👛</span>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 z-40">
        {connectors.length === 0 ? (
          <DropdownMenuItem disabled className="text-gray-500">
            No wallets available
          </DropdownMenuItem>
        ) : (
          connectors.map((connector) => (
            <DropdownMenuItem
              key={connector.id}
              onClick={async () => {
                console.log("[v0] Connecting to wallet:", connector.name)
                setIsOpen(false)
                setIsConnecting(true)
                try {
                  await connect({ connector })
                  console.log("[v0] Connect function completed for:", connector.name)
                } catch (error) {
                  console.error("[v0] Error during wallet connection:", error)
                  setIsConnecting(false)
                  toast({
                    title: "Connection Failed",
                    description: error instanceof Error ? error.message : "Failed to connect wallet",
                    variant: "destructive",
                  })
                }
              }}
              className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
              disabled={isConnecting}
            >
              {connector.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
