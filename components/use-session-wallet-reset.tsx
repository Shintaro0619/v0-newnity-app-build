"use client"

import { useEffect } from "react"

export function UseSessionWalletReset() {
  useEffect(() => {
    if (!sessionStorage.getItem("newnity_session_started")) {
      sessionStorage.setItem("newnity_session_started", "1")
      try {
        localStorage.removeItem("wagmi.connected")
        localStorage.removeItem("wagmi.store")
        localStorage.removeItem("rk-last-used-wallet")
        localStorage.removeItem("wc@2:core:pairing")
        console.log("[v0] Cleared wallet localStorage remnants")
      } catch (e) {
        console.error("[v0] Failed to clear localStorage:", e)
      }
    }
  }, [])
  return null
}
