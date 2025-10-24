"use client"

import { createConfig, http, createStorage } from "wagmi"
import { base, baseSepolia } from "wagmi/chains"
import { injected, coinbaseWallet, walletConnect } from "@wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""
const appName = "newnity"

export function getConnectors() {
  const list = [injected({ shimDisconnect: true }), coinbaseWallet({ appName })]

  // WalletConnect は projectId が設定されている場合のみ追加
  return projectId ? [...list, walletConnect({ projectId, showQrModal: true })] : list
}

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
  connectors: getConnectors(),
  autoConnect: false,
  storage: createStorage({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
  }),
  multiInjectedProviderDiscovery: false,
})

export const config = wagmiConfig
