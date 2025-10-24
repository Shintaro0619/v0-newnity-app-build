"use client"

import { useEffect } from "react"
import { useDisconnect } from "wagmi"

export function AutoDisconnectOnLoad() {
  const { disconnect } = useDisconnect()

  useEffect(() => {
    try {
      localStorage.removeItem("wagmi.store")
      localStorage.removeItem("wagmi.connected")
      console.log("[v0] Cleared wagmi localStorage on initial load")
    } catch (error) {
      console.warn("[v0] Failed to clear localStorage:", error)
    }

    disconnect()
  }, [disconnect])

  return null
}
