"use client"

import { useEffect, useRef } from "react"
import { useAccount, useDisconnect } from "wagmi"

const KEY_PATTERNS = [
  /^wagmi\./,
  /^wc@2:/,
  /^walletconnect/,
  /^rk-/,
  /^coinbaseWalletSDK:/,
  /^rainbowkit/,
  /^newnity_user_clicked_connect/,
  /metamask/i,
  /phantom/i,
  /okx/i,
  /coinbase/i,
  /trust/i,
  /binance/i,
  /wallet/i,
]

export function UseSessionWalletReset() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const hasCleanedRef = useRef(false)
  const disconnectAttemptRef = useRef(0)

  useEffect(() => {
    console.log("[v0] UseSessionWalletReset mounted")
    console.log("[v0] isConnected:", isConnected, "address:", address)

    const cleanStorage = () => {
      if (hasCleanedRef.current) return
      hasCleanedRef.current = true

      try {
        console.log("[v0] Cleaning all wallet storage...")

        // Clean localStorage
        const localKeys = Object.keys(localStorage)
        console.log("[v0] localStorage keys:", localKeys.length)
        localKeys.forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            console.log("[v0] Removing localStorage key:", k)
            localStorage.removeItem(k)
          }
        })

        // Clean sessionStorage (except newnity_user_clicked_connect)
        const sessionKeys = Object.keys(sessionStorage)
        console.log("[v0] sessionStorage keys:", sessionKeys.length)
        sessionKeys.forEach((k) => {
          if (k !== "newnity_user_clicked_connect" && KEY_PATTERNS.some((rx) => rx.test(k))) {
            console.log("[v0] Removing sessionStorage key:", k)
            sessionStorage.removeItem(k)
          }
        })

        // Clean IndexedDB
        const dbsToDelete = [
          "walletlink",
          "coinbase-wallet-sdk",
          "WALLET_CONNECT_V2_INDEXED_DB",
          "metamask",
          "okxwallet",
        ]
        dbsToDelete.forEach((dbName) => {
          try {
            indexedDB.deleteDatabase(dbName)
            console.log("[v0] Deleted IndexedDB:", dbName)
          } catch (e) {
            console.error("[v0] Failed to delete IndexedDB:", dbName, e)
          }
        })
      } catch (e) {
        console.error("[v0] Failed to clean storage:", e)
      }
    }

    cleanStorage()

    const checkAndDisconnect = async () => {
      try {
        const intended = sessionStorage.getItem("newnity_user_clicked_connect") === "1"
        console.log("[v0] Check - User explicitly connected:", intended, "isConnected:", isConnected)

        if (!intended && isConnected) {
          disconnectAttemptRef.current += 1
          console.log(
            "[v0] Auto-disconnect attempt #" + disconnectAttemptRef.current + ": user did not explicitly connect",
          )
          await disconnect()

          // 切断後もストレージをクリーンアップ
          Object.keys(localStorage).forEach((k) => {
            if (KEY_PATTERNS.some((rx) => rx.test(k))) {
              localStorage.removeItem(k)
            }
          })
        }
      } catch (e) {
        console.error("[v0] Failed to disconnect:", e)
      }
    }

    // 初回チェック
    checkAndDisconnect()

    const interval = setInterval(() => {
      checkAndDisconnect()
    }, 1000)

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
          sessionStorage.removeItem(k)
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
      clearInterval(interval)
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [isConnected, address, disconnect])

  return null
}
