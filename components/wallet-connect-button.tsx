"use client"
import { useState } from "react"
import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { switchChain } from "wagmi/actions"
import { config } from "@/lib/wagmi-config"
import { base, baseSepolia } from "wagmi/chains"

const SUPPORTED_CHAIN_IDS = [base.id, baseSepolia.id]

export function WalletConnectButton({ className }: { className?: string }) {
  const { isConnected } = useAccount()
  const { connectors, connectAsync, status } = useConnect()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  if (isConnected) {
    return null
  }

  const handleConnect = async (connector: any) => {
    const targetChainId = SUPPORTED_CHAIN_IDS[0]

    try {
      // Try to switch chain before connecting
      try {
        await switchChain(config, { chainId: targetChainId })
      } catch (switchError) {
        console.warn("[v0] Chain switch rejected before connection:", switchError)
        // If user rejects chain switch, don't proceed with connection
        return
      }

      await connectAsync({ connector, chainId: targetChainId })
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
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn("bg-white/10 hover:bg-green-600 hover:text-black transition-colors", className)}
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
                onClick={() => handleConnect(connector)}
                className="justify-start"
                disabled={status === "pending"}
              >
                {connector.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function subscribeToConnecting(listener: (isConnecting: boolean) => void) {
  return () => {}
}
