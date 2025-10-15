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

let configInstance: ReturnType<typeof createConfig> | null = null

export const config = (() => {
  if (configInstance) {
    console.log("[v0] Returning existing wagmi config instance")
    return configInstance
  }

  console.log("[v0] Creating new wagmi config instance")
  console.log("[v0] WalletConnect Project ID:", projectId ? "✓ Present" : "✗ Missing")

  const connectors = [injected()]
  console.log("[v0] Added injected connector")

  if (projectId) {
    try {
      const wcConnector = walletConnect({
        projectId,
        metadata: {
          name: "Newnity",
          description: "Decentralized crowdfunding platform on Base",
          url: getMetadataUrl(),
          icons: [`${getMetadataUrl()}/icon.png`],
        },
        showQrModal: true,
        qrModalOptions: {
          themeMode: "dark",
        },
      })
      connectors.push(wcConnector)
      console.log("[v0] Added WalletConnect connector successfully")
    } catch (error) {
      console.warn("[v0] Failed to initialize WalletConnect:", error)
      console.warn("[v0] Using injected connector only")
    }
  } else {
    console.warn("[v0] WalletConnect Project ID not found, using injected connector only")
  }

  configInstance = createConfig({
    chains: [baseSepolia, base],
    connectors,
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
  })

  console.log("[v0] Wagmi config created with", connectors.length, "connectors")

  return configInstance
})()
