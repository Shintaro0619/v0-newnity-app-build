"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

const KEY_PATTERNS = [/^wagmi\./, /^wc@2:/, /^walletconnect/, /^rk-last-used/, /^coinbaseWalletSDK:/, /^rainbowkit/]

export function UseSessionWalletReset() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Clean localStorage
        Object.keys(localStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            console.log("[v0] Removing localStorage key:", k)
            localStorage.removeItem(k)
          }
        })

        // Clean sessionStorage
        Object.keys(sessionStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            console.log("[v0] Removing sessionStorage key:", k)
            sessionStorage.removeItem(k)
          }
        })

        // Clean IndexedDB
        const dbsToDelete = ["walletlink", "coinbase-wallet-sdk", "WALLET_CONNECT_V2_INDEXED_DB"]
        dbsToDelete.forEach((dbName) => {
          try {
            indexedDB.deleteDatabase(dbName)
            console.log("[v0] Deleted IndexedDB:", dbName)
          } catch (e) {
            console.error("[v0] Failed to delete IndexedDB:", dbName, e)
          }
        })
      }
    } catch (e) {
      console.error("[v0] Failed to clean storage:", e)
    }

    const ensureDisconnected = async () => {
      try {
        const intended = sessionStorage.getItem("newnity_user_clicked_connect") === "1"
        if (!intended && isConnected) {
          console.log("[v0] Auto-disconnect: user did not explicitly connect")
          await disconnect()
        }
      } catch (e) {
        console.error("[v0] Failed to disconnect:", e)
      }
    }
    ensureDisconnected()

    const onBeforeUnload = async () => {
      try {
        // Clean all storage
        Object.keys(localStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            localStorage.removeItem(k)
          }
        })
        Object.keys(sessionStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            sessionStorage.removeItem(k)
          }
        })
        sessionStorage.removeItem("newnity_user_clicked_connect")

        // Disconnect wallet
        if (isConnected) {
          await disconnect()
        }
      } catch (e) {
        console.error("[v0] Failed to clean on unload:", e)
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isConnected, disconnect])

  return null
}
