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
        // 毎回実行（sessionStorageフラグを削除）
        Object.keys(localStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) {
            console.log("[v0] Removing localStorage key:", k)
            localStorage.removeItem(k)
          }
        })
      }
    } catch (e) {
      console.error("[v0] Failed to clean localStorage:", e)
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
        sessionStorage.removeItem("newnity_user_clicked_connect")
        if (isConnected) {
          await disconnect()
        }
      } catch (e) {
        console.error("[v0] Failed to disconnect on unload:", e)
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isConnected, disconnect])

  return null
}
