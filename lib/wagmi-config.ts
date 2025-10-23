"use client"

import { createConfig, cookieStorage, createStorage, http } from "wagmi"
import { base, baseSepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"

const connectorList = [injected()]

console.log("[v0] Wagmi config initialized with injected connector only")

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: connectorList,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
})
