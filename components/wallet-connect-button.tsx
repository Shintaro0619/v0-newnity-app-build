"use client"

import { useMemo, useState } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function WalletConnectButton() {
  const { isConnected, address } = useAccount()
  const { connectors, connect, status, error, reset } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)

  const visibleConnectors = useMemo(() => {
    if (typeof window === "undefined") return connectors
    const hasInjected = (window as any).ethereum || (window as any).okxwallet || (window as any).phantom
    return connectors.filter((c) => c.id !== "injected" || hasInjected)
  }, [connectors])

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <a className="underline text-sm" href={`/profile/${address}`}>
          View
        </a>
        <a className="underline text-sm" href="/settings">
          Edit
        </a>
        <Button variant="secondary" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => {
          reset()
          setOpen(true)
        }}
        className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-black font-semibold rounded-xl px-4 h-10 shadow-[0_8px_20px_rgba(16,185,129,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 transition"
      >
        Connect Wallet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl border border-white/12 bg-[#0A0D0C]/95 shadow-2xl ring-1 ring-emerald-400/20 backdrop-blur supports-[backdrop-filter]:bg-[#0A0D0C]/80">
          <DialogHeader>
            <DialogTitle>Select a wallet</DialogTitle>
            <DialogDescription>Choose a wallet provider to connect to newnity</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {visibleConnectors.map((c) => (
              <Button
                key={c.uid}
                className="w-full text-left rounded-lg border border-white/10 bg-white/2 hover:bg-white/6 px-4 py-3 transition"
                disabled={status === "pending"}
                onClick={async () => {
                  try {
                    await connect({ connector: c })
                    setOpen(false)
                  } catch (e) {
                    console.error("[WalletConnectButton] connect error:", e)
                  }
                }}
              >
                {c.name}
              </Button>
            ))}
            {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
