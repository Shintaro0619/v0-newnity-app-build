"use client"

import { useEffect } from "react"
import { disconnect } from "@wagmi/core"
import { config } from "@/lib/wagmi-config"

export function UseSessionWalletReset() {
  useEffect(() => {
    try {
      // LocalStorage削除
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

      // SessionStorageもクリア
      sessionStorage.setItem("wagmi.lastUsedConnector", "")
      sessionStorage.removeItem("wagmi.connected")
      sessionStorage.removeItem("wagmi.wallet")

      // IndexedDB削除
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
      deleteDB("WALLET_CONNECT_V2_INDEXED_DB")
      deleteDB("walletlink")
      deleteDB("coinbase-wallet-sdk")

      // 強制切断
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
