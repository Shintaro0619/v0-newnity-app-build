"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

export function UseSessionWalletReset() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return

    const intended = sessionStorage.getItem("newnity_user_clicked_connect") === "1"

    if (!intended && isConnected) {
      disconnect()
    }

    if (!intended) {
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("wagmi.") || k.startsWith("wc@2") || k.startsWith("rk-")) {
            localStorage.removeItem(k)
          }
        })
      } catch {}
      try {
        indexedDB.deleteDatabase("walletlink")
      } catch {}
      try {
        indexedDB.deleteDatabase("coinbase-wallet-sdk")
      } catch {}
      try {
        indexedDB.deleteDatabase("WALLET_CONNECT_V2_INDEXED_DB")
      } catch {}
    }
  }, [isConnected, disconnect])

  return null
}
