"use client"

import { useEffect } from "react"
import { getConnections, disconnect } from "@wagmi/core"
import { wagmiConfig } from "@/lib/wagmi-config"

// 残りやすいキー群（必要最小限）
const CLEAR_KEYS = [/^wagmi\./, /^wc@2:/, /^rk-last-used-wallet/, /^coinbase/]

export function DisconnectOnUnload() {
  useEffect(() => {
    const handler = () => {
      try {
        const conns = getConnections(wagmiConfig)
        for (const c of conns) disconnect(wagmiConfig, { connector: c.connector })
      } catch {}
      try {
        Object.keys(localStorage).forEach((k) => {
          if (CLEAR_KEYS.some((rx) => rx.test(k))) localStorage.removeItem(k)
        })
      } catch {}
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  return null
}
