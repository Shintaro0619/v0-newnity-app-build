"use client"

import { useEffect } from "react"
import { disconnect } from "@wagmi/core"
import { config } from "@/lib/wagmi-config"

export function UseSessionWalletReset() {
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage)
      const targets = keys.filter(
        (k) =>
          k.startsWith("wagmi.") ||
          k.startsWith("rk-") ||
          k.startsWith("wc@2:") ||
          k.toLowerCase().includes("coinbase") ||
          k.toLowerCase().includes("walletlink") ||
          k.toLowerCase().includes("walletconnect"),
      )
      targets.forEach((k) => localStorage.removeItem(k))
      sessionStorage.setItem("wagmi.lastUsedConnector", "")

      const deleteDB = (name: string) => {
        try {
          indexedDB.deleteDatabase(name)
        } catch (e) {
          console.error(`[v0] Failed to delete IndexedDB ${name}:`, e)
        }
      }
      deleteDB("walletconnect")
      deleteDB("walletconnect-store")
      deleteDB("WALLETCONNECT_V2_INDEXED_DB")

      try {
        disconnect(config)
      } catch (e) {
        console.error("[v0] Failed to disconnect:", e)
      }

      console.log("[v0] Cleared wallet localStorage and IndexedDB remnants")
    } catch (e) {
      console.error("[v0] Failed to clear storage:", e)
    }
  }, [])
  return null
}
