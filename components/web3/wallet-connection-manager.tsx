"use client"

import { useEffect } from "react"
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { SUPPORTED_CHAIN_IDS, PREFERRED_CHAIN_ID } from "@/lib/chains"

export default function WalletConnectionManager() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const router = useRouter()
  const pathname = usePathname()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { toast } = useToast()

  const isProtectedPage = pathname?.startsWith("/dashboard") || pathname?.startsWith("/profile")

  useEffect(() => {
    if (!isConnected && isProtectedPage) {
      console.log("[v0] Wallet disconnected, redirecting to home")
      router.replace("/")
      router.refresh()
    }
  }, [isConnected, isProtectedPage, router])

  useEffect(() => {
    if (!isConnected) return
    if (SUPPORTED_CHAIN_IDS.includes(chainId)) return
    ;(async () => {
      try {
        console.log("[v0] Unsupported chain detected, switching to:", PREFERRED_CHAIN_ID)
        toast({
          title: "Wrong network",
          description: "Switching to Base Sepolia...",
          variant: "default",
        })
        await switchChainAsync({ chainId: PREFERRED_CHAIN_ID })
        toast({ title: "Network switched", description: "You are now on Base Sepolia." })
        router.refresh()
      } catch (err) {
        console.error("[v0] Chain switch failed:", err)
        toast({
          title: "Network not supported",
          description: "Please switch your wallet to Base to continue.",
          variant: "destructive",
        })
        disconnect()
      }
    })()
  }, [isConnected, chainId, switchChainAsync, disconnect, toast, router])

  useEffect(() => {
    if (!isConnected || !address) return

    async function checkProfile() {
      try {
        const res = await fetch(`/api/users/${address}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        if (!data?.profile) {
          console.log("[v0] No profile found, redirecting to settings")
          router.push("/settings?onboarding=1")
        }
      } catch (error) {
        console.error("[v0] Error checking profile:", error)
      }
    }

    // Delay profile check to avoid race conditions
    const timer = setTimeout(checkProfile, 1000)
    return () => clearTimeout(timer)
  }, [isConnected, address, router])

  return null
}
