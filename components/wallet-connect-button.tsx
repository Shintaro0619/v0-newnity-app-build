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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            try {
              sessionStorage.removeItem("newnity_user_clicked_connect")
            } catch {}
            disconnect()
          }}
        >
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
        variant="wallet"
        className="rounded-xl px-4 h-10 font-semibold"
      >
        Connect Wallet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Select a wallet</DialogTitle>
            <DialogDescription>Choose a wallet provider to connect to newnity</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {visibleConnectors.map((c) => (
              <Button
                key={c.uid}
                variant={c.ready !== false ? "wallet" : "secondary"}
                disabled={status === "pending" || c.ready === false}
                onClick={async () => {
                  try {
                    await connect({ connector: c })
                    try {
                      sessionStorage.setItem("newnity_user_clicked_connect", "1")
                    } catch {}
                    setOpen(false)
                  } catch (e) {
                    console.error("[WalletConnectButton] connect error:", e)
                  }
                }}
                className="h-12 w-full justify-start gap-3 rounded-xl"
                data-wallet-option={c.name}
              >
                {c.icon && <img src={c.icon || "/placeholder.svg"} alt="" className="h-5 w-5 shrink-0" />}
                <span className="font-medium">{c.name}</span>
              </Button>
            ))}
            {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
