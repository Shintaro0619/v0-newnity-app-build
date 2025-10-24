"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function FaucetPage() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState(500)
  const [loading, setLoading] = useState(false)

  const onMint = async () => {
    if (!isConnected || !address) return toast.error("Connect wallet first")
    setLoading(true)
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Mint failed")
      toast.success(`Sent ${amount} test USDC`, { description: data.txHash })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4 min-h-screen flex flex-col justify-center">
      <h1 className="text-2xl font-semibold">Get Test USDC (Base Sepolia)</h1>
      <p className="text-sm opacity-80">Use this faucet to receive mock USDC for testing pledges on Base Sepolia.</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={100000}
          step={50}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-32 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        <Button onClick={onMint} disabled={loading} variant="wallet">
          {loading ? "Minting…" : "Get Test USDC"}
        </Button>
      </div>
      <div className="text-xs opacity-70">Requires Base Sepolia gas (ETH). Typical amounts: 100 / 500 / 1000 USDC.</div>
    </main>
  )
}
