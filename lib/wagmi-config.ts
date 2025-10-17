import { http, createConfig } from "wagmi"
import { baseSepolia, base } from "wagmi/chains"
import { injected } from "wagmi/connectors"

// WalletConnect's heartbeat feature causes "Cannot read properties of undefined (reading 'apply')" errors
// in the browser environment. Using injected connectors (MetaMask, etc.) only for now.

if (typeof window !== "undefined") {
  // Polyfill process object for any remaining dependencies
  if (typeof (window as any).process === "undefined") {
    ;(window as any).process = {
      env: {},
      version: "v18.0.0",
      versions: {},
      platform: "browser",
      nextTick: (callback: Function, ...args: any[]) => {
        setTimeout(() => callback(...args), 0)
      },
      emitWarning: function emitWarning(...args: any[]) {
        return undefined
      },
    }
  }
}

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ""

let configInstance: ReturnType<typeof createConfig> | null = null

export const config = (() => {
  if (configInstance) {
    console.log("[v0] Returning existing wagmi config instance")
    return configInstance
  }

  console.log("[v0] Creating new wagmi config instance")
  console.log("[v0] WalletConnect Project ID:", projectId ? "✓ Present (disabled)" : "✗ Missing")

  const connectors = [injected()]
  console.log("[v0] Added injected connector")
  console.log("[v0] Note: WalletConnect is temporarily disabled to prevent EventEmitter errors")

  configInstance = createConfig({
    chains: [baseSepolia, base],
    connectors,
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
  })

  console.log("[v0] Wagmi config created with", connectors.length, "connector(s)")

  return configInstance
})()
