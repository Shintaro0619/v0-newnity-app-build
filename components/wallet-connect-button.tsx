"use client"

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { SUPPORTED_CHAINS, getChainName, isChainSupported, config } from "@/lib/wagmi"
import { walletConnect } from "wagmi/connectors"
import { WC_PROJECT_ID } from "@/lib/publicEnv"
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

function getWalletConnectConnector() {
  const list = config.connectors

  // Log all connectors for debugging
  if (typeof window !== "undefined") {
    console.log(
      "[v0] Connectors detail:",
      list.map((c: any) => ({ id: c.id, name: c.name, type: c.type })),
    )
  }

  // Multi-faceted detection: check id, type, and name
  const found = list.find(
    (c: any) =>
      c.id === "walletConnect" ||
      c.type === "walletConnect" ||
      /wallet.?connect/i.test(c.id) ||
      /wallet.?connect/i.test(c.name),
  )

  if (found) {
    console.log("[v0] WalletConnect connector found in config:", found.id)
    return found
  }

  // Fallback: create a new WalletConnect connector on the fly
  console.warn("[v0] WalletConnect connector not found in config. Creating fallback connector.")
  return walletConnect({
    projectId: WC_PROJECT_ID || "___MISSING_PROJECT_ID___",
    showQrModal: true,
    metadata: {
      name: "newnity",
      description: "USDC crowdfunding platform with FanFi layer",
      url: "https://newnity.vercel.app",
      icons: ["https://newnity.vercel.app/icon.png"],
    },
  })
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
  const [enhancedConnectors, setEnhancedConnectors] = useState(connectors)

  const connectWith = useConnectWithChainEnforcement()

  useEffect(() => {
    setGlobalConnecting(isConnecting)
  }, [isConnecting])

  useEffect(() => {
    console.log(
      "[v0] Available wallet connectors:",
      connectors.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    )
    const hasWalletConnect = connectors.some(
      (c) => c.id === "walletConnect" || c.name.toLowerCase().includes("walletconnect"),
    )
    if (!hasWalletConnect) {
      console.warn("[v0] WalletConnect connector not found in config. Will use fallback when needed.")
      const fallbackConnector = getWalletConnectConnector()
      setEnhancedConnectors([...connectors, fallbackConnector as any])
    } else {
      setEnhancedConnectors(connectors)
    }
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-gray-300 border-gray-700 bg-transparent",
            "hover:bg-green-600 hover:text-white hover:border-green-600",
            "transition-all duration-200",
            "cursor-pointer",
            className,
          )}
          disabled={isConnecting}
          onClick={() => {
            console.log("[v0] Connect Wallet button clicked")
            setIsOpen(true)
          }}
        >
          <span className="mr-2">👛</span>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 z-[9999] mt-4">
        {enhancedConnectors.length === 0 ? (
          <DropdownMenuItem disabled className="text-gray-500">
            No wallets available
          </DropdownMenuItem>
        ) : (
          enhancedConnectors.map((connector) => (
            <DropdownMenuItem
              key={connector.id}
              onClick={async () => {
                console.log("[v0] Connecting to wallet:", connector.name)
                setIsOpen(false)
                setIsConnecting(true)
                try {
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
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
