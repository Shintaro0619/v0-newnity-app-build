"use client"
import { useEffect } from "react"
import { disconnect } from "@wagmi/core"
import { config } from "@/lib/wagmi-config"

const KEY_PATTERNS = /^(wagmi\.|rk-|wc@2|walletconnect|WALLETCONNECT|coinbase|CBWallet|cbwsdk)/i
const WC_DBS = ["walletconnect", "walletconnect-store", "WALLETCONNECT_V2_INDEXED_DB", "WalletConnect"]

export default function SessionWalletReset() {
  useEffect(() => {
    if (!sessionStorage.getItem("newnity_session_started")) {
      sessionStorage.setItem("newnity_session_started", "1")
      try {
        Object.keys(localStorage).forEach((k) => {
          if (KEY_PATTERNS.test(k)) localStorage.removeItem(k)
        })
      } catch {}
      try {
        WC_DBS.forEach((name) => {
          try {
            indexedDB.deleteDatabase(name)
          } catch {}
        })
      } catch {}
      try {
        disconnect(config)
      } catch {}
    }
  }, [])
  return null
}
