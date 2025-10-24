"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { useProfileStore } from "@/lib/stores/profile"
import { base, baseSepolia } from "wagmi/chains"
import { switchChain } from "wagmi/actions"
import { config } from "@/lib/wagmi-config"

const SUPPORTED_CHAIN_IDS = [base.id, baseSepolia.id]

export function WalletConnectionManager() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const clearProfile = useProfileStore((state) => state.clear)

  useEffect(() => {
    if (!isConnected || !address) {
      clearProfile()
      try {
        localStorage.removeItem("wagmi.connected")
        localStorage.removeItem("wc@2:client")
      } catch (error) {
        // Storage not available
      }
    }
  }, [address, isConnected, clearProfile])

  useEffect(() => {
    if (!chain?.id || !isConnected) return

    const isSupported = SUPPORTED_CHAIN_IDS.includes(chain.id)
    if (!isSupported) {
      const targetChainId = SUPPORTED_CHAIN_IDS[0]
      switchChain(config, { chainId: targetChainId }).catch((error) => {
        console.error("[v0] Failed to switch chain:", error)
        // If user rejects chain switch, disconnect
        disconnect()
        clearProfile()
      })
    }
  }, [chain?.id, isConnected, disconnect, clearProfile])

  return null
}
