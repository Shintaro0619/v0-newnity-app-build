import { http, createConfig } from "wagmi"
import { baseSepolia, base } from "wagmi/chains"
import { injected } from "wagmi/connectors"

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
    return configInstance
  }

  const connectors = [injected()]

  configInstance = createConfig({
    chains: [baseSepolia, base],
    connectors,
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
  })

  return configInstance
})()
