"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

const KEY_PATTERNS = [/^wagmi\./, /^wc@2:/, /^walletconnect/, /^rk-last-used/, /^coinbaseWalletSDK:/, /^rainbowkit/]

export function UseSessionWalletReset() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !sessionStorage.getItem("__wallet_init__")) {
        Object.keys(localStorage).forEach((k) => {
          if (KEY_PATTERNS.some((rx) => rx.test(k))) localStorage.removeItem(k)
        })
        sessionStorage.setItem("__wallet_init__", "1")
      }
    } catch {}

    const ensureDisconnected = async () => {
      try {
        const intended = sessionStorage.getItem("newnity_user_clicked_connect") === "1"
        if (!intended && isConnected) {
          await disconnect()
        }
      } catch {}
    }
    ensureDisconnected()

    const onBeforeUnload = async () => {
      try {
        sessionStorage.removeItem("newnity_user_clicked_connect")
        await disconnect()
      } catch {}
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isConnected, disconnect])

  return null
}
