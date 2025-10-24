"use client"

import { useEffect } from "react"

export function UseSessionWalletReset() {
  useEffect(() => {
    if (!sessionStorage.getItem("newnity_session_started")) {
      sessionStorage.setItem("newnity_session_started", "1")
      try {
        const keys = Object.keys(localStorage)
        keys.forEach((k) => {
          if (/^wagmi\.|^rk-|^wc@2|walletconnect/i.test(k)) {
            localStorage.removeItem(k)
          }
        })

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

        console.log("[v0] Cleared wallet localStorage and IndexedDB remnants")
      } catch (e) {
        console.error("[v0] Failed to clear storage:", e)
      }
    }
  }, [])
  return null
}
