import { http, createConfig } from "wagmi"
import { baseSepolia, base } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ""

const getMetadataUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "https://newnity.app"
}

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: "Newnity",
        description: "Decentralized crowdfunding platform on Base",
        url: getMetadataUrl(),
        icons: [`${getMetadataUrl()}/icon.png`],
      },
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
})
