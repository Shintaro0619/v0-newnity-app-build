"use client"

import type React from "react"
import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/wagmi-config"

const queryClient = new QueryClient()

function ErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error
    console.error = (...args: any[]) => {
      const errorString = String(args[0])

      // Suppress WalletConnect heartbeat errors
      if (errorString.includes("Cannot read properties of undefined") && errorString.includes("apply")) {
        return
      }

      // Suppress WalletConnect pulse/analytics errors
      if (errorString.includes("pulse.walletconnect.org") || errorString.includes("Missing origin header")) {
        return
      }

      originalError.apply(console, args)
    }

    // Suppress uncaught errors from WalletConnect
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || ""

      if (
        errorMessage.includes("Cannot read properties of undefined") ||
        errorMessage.includes("pulse.walletconnect.org") ||
        errorMessage.includes("Missing origin header")
      ) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Suppress unhandled promise rejections from WalletConnect
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason)

      if (
        reason.includes("pulse.walletconnect.org") ||
        reason.includes("Missing origin header") ||
        reason.includes("Bad Request")
      ) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      console.error = originalError
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ErrorSuppressor />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
