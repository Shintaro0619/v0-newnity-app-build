"use client"

import { useEffect } from "react"

import { useState } from "react"

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

type ConnectingListener = (isConnecting: boolean) => void
const connectingListeners = new Set<ConnectingListener>()
let currentConnectingState = false

export function subscribeToConnecting(listener: ConnectingListener) {
  connectingListeners.add(listener)
  listener(currentConnectingState)
  return () => {
    connectingListeners.delete(listener)
  }
}

function notifyConnectingListeners(isConnecting: boolean) {
  currentConnectingState = isConnecting
  connectingListeners.forEach((listener) => listener(isConnecting))
}

export function WalletConnectButton({ className }: { className?: string }) {
  const { address, isConnected, chain } = useAccount()
  const { connectors, connectAsync, status } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [showChainSwitchDialog, setShowChainSwitchDialog] = useState(false)
  const [targetChainId, setTargetChainId] = useState<number | null>(null)

  useEffect(() => {
    notifyConnectingListeners(status === "pending")
  }, [status])

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
    <>
      <Button
        onClick={() => {
          console.log("[v0] Connect Wallet button clicked")
          setOpen(true)
        }}
        className={cn("transition-colors hover:bg-green-600", className)}
        disabled={status === "pending"}
      >
        {status === "pending" ? "Connecting..." : "Connect Wallet"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a wallet</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                variant="outline"
                onClick={async () => {
                  console.log("[v0] Wallet connector selected:", connector.name)
                  try {
                    await connectAsync({ connector })
                    setOpen(false)
                    toast({
                      title: "Wallet Connected",
                      description: `Connected with ${connector.name}`,
                    })
                  } catch (error) {
                    console.error("[v0] Connection error:", error)
                    if (error instanceof Error && !error.message.includes("rejected")) {
                      toast({
                        title: "Connection Failed",
                        description: error.message || "Failed to connect wallet",
                        variant: "destructive",
                      })
                    }
                  }
                }}
                className="justify-start"
                disabled={status === "pending"}
              >
                {connector.name}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-2">Status: {status}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
