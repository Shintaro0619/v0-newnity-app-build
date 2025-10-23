"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAccount } from "wagmi"
import { WalletConnectButton } from "@/components/wallet-connect-button"

export default function RequireWallet({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
            <CardDescription>Please connect your wallet to view this page.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This page requires a wallet connection to access your data and interact with the blockchain.
            </p>
            <div className="flex flex-col gap-2">
              <WalletConnectButton className="w-full hover:bg-primary hover:text-primary-foreground transition-colors" />
              <Button asChild variant="outline">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
