"use client"

import { useConnect, useSwitchChain } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { PREFERRED_CHAIN_ID } from "@/lib/chains"
import type { Connector } from "wagmi"

export function useConnectWithChainEnforcement() {
  const { connectAsync } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { toast } = useToast()

  return async function connectWith(connector: Connector) {
    try {
      console.log("[v0] Connecting with chain enforcement:", connector.name, "chainId:", PREFERRED_CHAIN_ID)

      await connectAsync({ connector, chainId: PREFERRED_CHAIN_ID })

      toast({
        title: "Wallet connected",
        description: `Connected to ${connector.name}`,
      })
    } catch (e: any) {
      console.error("[v0] Connection error:", e)

      if (/chain|network|configured/i.test(String(e?.message)) || e?.name?.includes("ChainNotConfigured")) {
        try {
          console.log("[v0] Chain error detected, attempting to switch chain")
          await switchChainAsync({ chainId: PREFERRED_CHAIN_ID })
          await connectAsync({ connector })

          toast({
            title: "Wallet connected",
            description: "Connected after switching network",
          })
        } catch (switchError) {
          console.error("[v0] Chain switch failed:", switchError)
          toast({
            title: "Wrong network",
            description: "Please switch your wallet to Base Sepolia to connect.",
            variant: "destructive",
          })
          throw switchError
        }
      } else {
        throw e
      }
    }
  }
}
