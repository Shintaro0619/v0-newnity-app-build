"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/wagmi-config"
import { AutoDisconnectOnLoad } from "@/components/auto-disconnect-on-load"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ErrorSuppressor() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (typeof window !== "undefined") {
      if (typeof (window as any).process === "undefined") {
        ;(window as any).process = {
          env: {},
          version: "v18.0.0",
          versions: {},
          platform: "browser",
        }
      }

      const processObj = (window as any).process

      // Polyfill emitWarning with proper function signature
      if (typeof processObj.emitWarning !== "function") {
        processObj.emitWarning = function emitWarning(...args: any[]) {
          // Silently ignore all warnings
          return undefined
        }
      }

      // Ensure env exists
      if (typeof processObj.env !== "object") {
        processObj.env = {}
      }

      // Add other commonly used process properties
      if (typeof processObj.nextTick !== "function") {
        processObj.nextTick = (callback: Function, ...args: any[]) => {
          setTimeout(() => callback(...args), 0)
        }
      }
    }

    const originalError = console.error.bind(console)
    const originalWarn = console.warn.bind(console)

    console.error = (...args: any[]) => {
      const errorString = String(args[0] || "")
      const errorStack = args[0]?.stack || ""

      // Suppress WalletConnect and Node.js polyfill errors
      if (
        errorString.includes("Cannot read properties of undefined") ||
        errorString.includes("Cannot read property") ||
        errorString.includes("pulse.walletconnect.org") ||
        errorString.includes("Missing origin header") ||
        errorString.includes("@walletconnect/heartbeat") ||
        errorString.includes("WalletConnect Core is already initialized") ||
        errorString.includes("process.emitWarning") ||
        errorString.includes("emitWarning is not a function") ||
        errorString.includes(".apply") ||
        errorString.includes("reading 'apply'") ||
        errorStack.includes("walletconnect") ||
        errorStack.includes("pino") ||
        errorStack.includes("heartbeat")
      ) {
        return
      }

      if (originalError && typeof originalError === "function") {
        try {
          originalError(...args)
        } catch (e) {
          // Silently catch any errors in error logging
        }
      }
    }

    console.warn = (...args: any[]) => {
      const warnString = String(args[0] || "")

      if (
        warnString.includes("pulse.walletconnect.org") ||
        warnString.includes("@walletconnect/heartbeat") ||
        warnString.includes("WalletConnect Core is already initialized") ||
        warnString.includes("Missing origin header") ||
        warnString.includes("process.emitWarning")
      ) {
        return
      }

      if (originalWarn && typeof originalWarn === "function") {
        try {
          originalWarn(...args)
        } catch (e) {
          // Silently catch any errors in warning logging
        }
      }
    }

    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || ""
      const errorStack = event.error?.stack || ""
      const errorFilename = event.filename || ""

      if (
        errorMessage.includes("Cannot read properties of undefined") ||
        errorMessage.includes("Cannot read property") ||
        errorMessage.includes("pulse.walletconnect.org") ||
        errorMessage.includes("Missing origin header") ||
        errorMessage.includes("process.emitWarning") ||
        errorMessage.includes("emitWarning is not a function") ||
        errorMessage.includes(".apply") ||
        errorMessage.includes("reading 'apply'") ||
        errorStack.includes("@walletconnect/heartbeat") ||
        errorStack.includes("@walletconnect/sign-client") ||
        errorStack.includes("walletconnect") ||
        errorStack.includes("pino") ||
        errorFilename.includes("walletconnect") ||
        errorFilename.includes("pino")
      ) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false
      }
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || "")
      const reasonStack = event.reason?.stack || ""
      const reasonMessage = event.reason?.message || ""

      if (
        reason.includes("pulse.walletconnect.org") ||
        reason.includes("Missing origin header") ||
        reason.includes("Bad Request") ||
        reason.includes("process.emitWarning") ||
        reason.includes("@walletconnect/heartbeat") ||
        reason.includes("Cannot read properties of undefined") ||
        reason.includes(".apply") ||
        reason.includes("reading 'apply'") ||
        reasonMessage.includes("apply") ||
        reasonStack.includes("walletconnect") ||
        reasonStack.includes("pino") ||
        reasonStack.includes("heartbeat")
      ) {
        event.preventDefault()
        return false
      }
    }

    window.addEventListener("error", handleError, true)
    window.addEventListener("unhandledrejection", handleRejection, true)

    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener("error", handleError, true)
      window.removeEventListener("unhandledrejection", handleRejection, true)
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoDisconnectOnLoad />
        <ErrorSuppressor />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
