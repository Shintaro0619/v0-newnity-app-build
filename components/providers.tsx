"use client"

import type React from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "@/lib/wagmi-config"
import { useEffect } from "react"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url
      // Suppress WalletConnect pulse/analytics errors
      if (url?.includes("pulse.walletconnect.org")) {
        return new Response(null, { status: 200 })
      }
      return originalFetch(...args)
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
