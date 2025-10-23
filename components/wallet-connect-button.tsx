"use client"

import type React from "react"

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { SUPPORTED_CHAINS, getChainName, isChainSupported } from "@/lib/wagmi"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useConnectWithChainEnforcement } from "@/hooks/use-connect-with-chain-enforcement"

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

export function WalletConnectButton({ className }: { className?: string }) {
  const { address, isConnected, chain } = useAccount()
  const { connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showChainSwitchDialog, setShowChainSwitchDialog] = useState(false)
  const [targetChainId, setTargetChainId] = useState<number | null>(null)

  const connectWith = useConnectWithChainEnforcement()

  useEffect(() => {
    console.log("[v0] WalletConnectButton component mounted")
    console.log("[v0] Initial state:", { isConnected, address: address || "none", isConnecting })
    return () => {
      console.log("[v0] WalletConnectButton component unmounted")
    }
  }, [])

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
    console.log("[v0] Dropdown menu state changed:", { isOpen })
  }, [isOpen])

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

  useEffect(() => {
    if (isConnected && chain && !isChainSupported(chain.id)) {
      console.log("[v0] Unsupported chain detected:", chain.id, chain.name)
      setTargetChainId(SUPPORTED_CHAINS[0].id)
      setShowChainSwitchDialog(true)
    }
  }, [isConnected, chain])

  const handleChainSwitch = async () => {
    if (!targetChainId) return

    try {
      console.log("[v0] Switching to chain:", targetChainId, getChainName(targetChainId))
      await switchChain({ chainId: targetChainId })
      toast({
        title: "Network Switched",
        description: `Switched to ${getChainName(targetChainId)}`,
      })
      setShowChainSwitchDialog(false)
      setTargetChainId(null)
    } catch (error) {
      console.error("[v0] Chain switch failed:", error)
      toast({
        title: "Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
        variant: "destructive",
      })
    }
  }

  const handleChainSwitchCancel = () => {
    setShowChainSwitchDialog(false)
    setTargetChainId(null)
    disconnect()
    toast({
      title: "Disconnected",
      description: "Wallet disconnected due to unsupported network",
      variant: "destructive",
    })
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("[v0] Connect Wallet button clicked - event details:", {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      isConnecting,
      isOpen,
    })

    if (isConnecting) {
      console.log("[v0] Button click ignored - already connecting")
      return
    }

    console.log("[v0] Opening dropdown menu")
    setIsOpen(true)
  }

  if (isConnected && address) {
    return (
      <>
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

        <AlertDialog open={showChainSwitchDialog} onOpenChange={setShowChainSwitchDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsupported Network</AlertDialogTitle>
              <AlertDialogDescription>
                You are currently connected to <strong>{chain?.name || "an unsupported network"}</strong>.
                <br />
                <br />
                This app only supports the following networks:
                <ul className="list-disc list-inside mt-2">
                  {SUPPORTED_CHAINS.map((supportedChain) => (
                    <li key={supportedChain.id}>{supportedChain.name}</li>
                  ))}
                </ul>
                <br />
                Would you like to switch to{" "}
                <strong>{targetChainId ? getChainName(targetChainId) : "a supported network"}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleChainSwitchCancel}>Cancel & Disconnect</AlertDialogCancel>
              <AlertDialogAction onClick={handleChainSwitch}>Switch Network</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        console.log("[v0] Dropdown onOpenChange called:", open)
        setIsOpen(open)
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-gray-300 border-gray-700 bg-transparent",
            "hover:bg-green-600/20 hover:text-green-500 hover:border-green-600",
            "transition-all duration-200",
            "cursor-pointer",
            "relative z-[101]",
            className,
          )}
          disabled={isConnecting}
          onClick={handleButtonClick}
        >
          <span className="mr-2">👛</span>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 z-[9999]">
        {connectors.length === 0 ? (
          <DropdownMenuItem disabled className="text-gray-500">
            No wallets available
          </DropdownMenuItem>
        ) : (
          <>
            {connectors.map((connector) => (
              <DropdownMenuItem
                key={connector.id}
                onClick={async () => {
                  console.log("[v0] Wallet connector selected:", connector.name, connector.id)
                  setIsOpen(false)
                  setIsConnecting(true)
                  try {
                    console.log("[v0] Calling connectWith for:", connector.name)
                    await connectWith(connector)
                    console.log("[v0] Connect function completed for:", connector.name)
                  } catch (error) {
                    console.error("[v0] Error during wallet connection:", error)
                    setIsConnecting(false)
                    if (error instanceof Error && !error.message.includes("rejected")) {
                      toast({
                        title: "Connection Failed",
                        description: error.message || "Failed to connect wallet",
                        variant: "destructive",
                      })
                    }
                  }
                }}
                className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                disabled={isConnecting}
              >
                {connector.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
