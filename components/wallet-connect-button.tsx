"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <Button onClick={() => disconnect()} variant="outline" size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect with {connector.name}
        </Button>
      ))}
    </div>
  )
}
