"use client"

import { useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"

/**
 * ブラウザ拡張機能（MetaMask、Phantom等）の自動接続を監視して、
 * ユーザーが明示的に接続していない場合は強制的に切断する
 */
export function WalletExtensionMonitor() {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    // ユーザーが明示的に接続したかどうかをチェック
    const userClickedConnect = sessionStorage.getItem("newnity_user_clicked_connect")

    if (isConnected && !userClickedConnect) {
      console.log("[v0] Wallet extension auto-connected detected, disconnecting...")
      disconnect()

      // localStorage/sessionStorageをクリーンアップ
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("wagmi.") ||
          key.startsWith("wc@2") ||
          key.startsWith("rk-") ||
          key.startsWith("walletconnect") ||
          key.includes("metamask") ||
          key.includes("coinbase")
        ) {
          localStorage.removeItem(key)
        }
      })

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("wagmi.") || key.startsWith("wc@2") || key.startsWith("rk-")) {
          sessionStorage.removeItem(key)
        }
      })
    }
  }, [isConnected, disconnect])

  return null
}
