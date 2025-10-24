"use client"
import { useState, useMemo } from "react"
import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { base, baseSepolia } from "wagmi/chains"

const SUPPORTED_CHAIN_IDS = [base.id, baseSepolia.id]

export function WalletConnectButton({ className }: { className?: string }) {
  const { isConnected } = useAccount()
  const { connectors, connectAsync, status } = useConnect()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const injectedConnector = useMemo(() => connectors.find((c) => c.id === "injected"), [connectors])

  const handleClick = () => {
    if (injectedConnector) {
      connectAsync({ connector: injectedConnector })
      setOpen(false)
      toast({
        title: "Wallet Connected",
        description: `Connected with ${injectedConnector.name}`,
      })
      return
    }
    // injectedがなければ最初のコネクタ（WalletConnectなど）を使用
    if (connectors[0]) {
      connectAsync({ connector: connectors[0] })
      setOpen(false)
      toast({
        title: "Wallet Connected",
        description: `Connected with ${connectors[0].name}`,
      })
    }
  }

  if (isConnected) {
    return null
  }

  return (
    <>
      <Button
        onClick={handleClick}
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
                onClick={() => connectAsync({ connector })}
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
