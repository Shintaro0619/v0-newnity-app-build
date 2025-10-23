"use client"

import { createConfig, http, cookieStorage, createStorage } from "wagmi"
import { base, baseSepolia } from "wagmi/chains"
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors"

const isClient = typeof window !== "undefined"

// 両方の環境変数名に対応
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WC_PROJECT_ID || ""

function buildConnectors() {
  const list = [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "newnity", preference: "eoaOnly" }),
  ] as any[]

  // クライアント側でのみWalletConnectを追加
  if (isClient && WC_PROJECT_ID) {
    list.push(
      walletConnect({
        projectId: WC_PROJECT_ID,
        showQrModal: true,
        metadata: {
          name: "newnity",
          description: "USDC crowdfunding on Base",
          url: "https://newnity.vercel.app",
          icons: ["https://newnity.vercel.app/icon.png"],
        },
      }),
    )
    console.log("[v0] WalletConnect connector initialized successfully")
  } else {
    console.warn("[v0] WalletConnect not initialized:", { isClient, hasProjectId: !!WC_PROJECT_ID })
  }

  return list
}

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  connectors: buildConnectors(),
})

console.log("[v0] Wagmi config initialized with injected connector only")
