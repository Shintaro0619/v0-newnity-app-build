"use client"

import { createConfig, http, cookieStorage, createStorage } from "wagmi"
import { baseSepolia, sepolia } from "wagmi/chains"
import { injected, coinbaseWallet } from "wagmi/connectors"

const chains = [baseSepolia, sepolia] as const

export function buildConnectors() {
  // Only use injected (MetaMask, OKX, Bitget, etc.) and Coinbase Wallet
  const list = [injected({ shimDisconnect: true }), coinbaseWallet({ appName: "newnity" })]

  // WalletConnect is temporarily disabled due to heartbeat errors
  // Uncomment when the issue is resolved:
  // const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ""
  // if (typeof window !== "undefined" && projectId) {
  //   list.push(
  //     walletConnect({
  //       projectId,
  //       metadata: {
  //         name: "newnity",
  //         description: "newnity dApp",
  //         url: "https://newnity.vercel.app",
  //         icons: ["https://newnity.vercel.app/icon.png"],
  //       },
  //       showQrModal: true,
  //     }),
  //   )
  // }

  return list
}

export const config = createConfig({
  chains,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
  connectors: buildConnectors(),
  ssr: true,
  autoConnect: false,
  storage: createStorage({ storage: cookieStorage, key: "newnity_wagmi" }),
  multiInjectedProviderDiscovery: false,
  syncConnectedChain: false,
})
