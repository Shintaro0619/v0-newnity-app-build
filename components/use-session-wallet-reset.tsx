"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

const KEY_PATTERNS = [
  /^wagmi\./,
  /^wc@2:/,
  /^walletconnect/,
  /^rk-last-used/,
  /^coinbaseWalletSDK:/,
  /^rainbowkit/,
  /^newnity_user_clicked_connect/,
]

export function UseSessionWalletReset() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    console.log("[v0] UseSessionWalletReset mounted, isConnected:", isConnected)

    const cleanStorage = () => {
      try {
        if (typeof window !== "undefined") {
          console.log("[v0] Cleaning storage on mount...")

          // Clean localStorage
          const localKeys = Object.keys(localStorage)
          console.log("[v0] localStorage keys before cleanup:", localKeys)
          localKeys.forEach((k) => {
            if (KEY_PATTERNS.some((rx) => rx.test(k))) {
              console.log("[v0] Removing localStorage key:", k)
              localStorage.removeItem(k)
            }
          })

          // Clean sessionStorage
          const sessionKeys = Object.keys(sessionStorage)
          console.log("[v0] sessionStorage keys before cleanup:", sessionKeys)
          sessionKeys.forEach((k) => {
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
    }

    cleanStorage()

    const ensureDisconnected = async () => {
      try {
        const intended = sessionStorage.getItem("newnity_user_clicked_connect") === "1"
        console.log("[v0] User explicitly connected:", intended, "isConnected:", isConnected)

        if (!intended && isConnected) {
          console.log("[v0] Auto-disconnect: user did not explicitly connect")
          await disconnect()
        }
      } catch (e) {
        console.error("[v0] Failed to disconnect:", e)
      }
    }

    const timer = setTimeout(() => {
      ensureDisconnected()
    }, 100)

    const onBeforeUnload = async () => {
      console.log("[v0] beforeunload event triggered")
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

        // Disconnect wallet
        if (isConnected) {
          console.log("[v0] Disconnecting wallet on beforeunload")
          await disconnect()
        }
      } catch (e) {
        console.error("[v0] Failed to clean on unload:", e)
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [isConnected, disconnect])

  return null
}
