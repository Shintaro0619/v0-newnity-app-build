"use client"

import { createConfig, http } from "wagmi"
import { mainnet, base, baseSepolia } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

export function makeWagmiConfig() {
  const connectors = [injected({ shimDisconnect: true })]

  if (typeof window !== "undefined" && projectId) {
    connectors.push(walletConnect({ projectId, showQrModal: true }))
  } else {
    console.log("[v0] WalletConnect not initialized", {
      isClient: typeof window !== "undefined",
      hasProjectId: !!projectId,
    })
  }

  return createConfig({
    chains: [base, baseSepolia, mainnet],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [mainnet.id]: http(),
    },
    connectors,
    autoConnect: false,
    ssr: true,
  })
}

export const config = makeWagmiConfig()
