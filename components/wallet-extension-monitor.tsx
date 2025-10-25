"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

const WALLET_STORAGE_PATTERNS = [
  /^wagmi\./,
  /^wc@2/,
  /^rk-/,
  /^walletconnect/,
  /metamask/i,
  /phantom/i,
  /okx/i,
  /coinbase/i,
  /trust/i,
  /binance/i,
  /wallet/i,
]

/**
 * ブラウザ拡張機能（MetaMask、Phantom、OKX Wallet等）の自動接続を監視して、
 * ユーザーが明示的に接続していない場合は強制的に切断する
 */
export function WalletExtensionMonitor() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    console.log("[v0] WalletExtensionMonitor - isConnected:", isConnected, "address:", address)

    const userClickedConnect = sessionStorage.getItem("newnity_user_clicked_connect")

    if (isConnected && !userClickedConnect) {
      console.log("[v0] Wallet extension auto-connected detected, disconnecting...")
      disconnect()

      Object.keys(localStorage).forEach((key) => {
        if (WALLET_STORAGE_PATTERNS.some((pattern) => pattern.test(key))) {
          console.log("[v0] Removing localStorage key:", key)
          localStorage.removeItem(key)
        }
      })

      Object.keys(sessionStorage).forEach((key) => {
        if (key !== "newnity_user_clicked_connect" && WALLET_STORAGE_PATTERNS.some((pattern) => pattern.test(key))) {
          console.log("[v0] Removing sessionStorage key:", key)
          sessionStorage.removeItem(key)
        }
      })
    }
  }, [isConnected, address, disconnect])

  return null
}
