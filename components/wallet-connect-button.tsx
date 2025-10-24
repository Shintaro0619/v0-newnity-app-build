"use client"
import { useState } from "react"
import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { base, baseSepolia } from "wagmi/chains"

const SUPPORTED_CHAIN_IDS = [base.id, baseSepolia.id]

export function WalletConnectButton() {
  const { isConnected } = useAccount()
  const { connectors, connect, isPending, error } = useConnect()
  const [open, setOpen] = useState(false)

  if (isConnected) return null

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="bg-white/10 hover:bg-green-600 hover:text-black transition-colors"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a wallet</DialogTitle>
            <DialogDescription>Choose a wallet provider to connect to newnity</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {connectors.map((c) => (
              <Button
                key={c.uid}
                className="w-full justify-between"
                disabled={!c.ready || isPending}
                onClick={() => {
                  connect({ connector: c })
                  setOpen(false)
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>
          {error ? <p className="text-sm text-red-500 mt-2">{error.message}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
