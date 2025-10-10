"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAccount, useWalletClient } from "wagmi"
import { parseUnits, encodeFunctionData } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Zap, Shield } from "lucide-react"
import { toast } from "sonner"
import { MOCK_USDC_ADDRESS, ESCROW_VAULT_ADDRESS, MOCK_USDC_ABI, ESCROW_VAULT_ABI } from "@/lib/wagmi"
import { createSmartAccount, AA_UTILS } from "@/lib/account-abstraction"

interface Tier {
  id: string
  name: string
  minAmount: number
  description: string
  rewards: string[]
}

interface AAPledgeModalProps {
  campaignId: number
  tiers: Tier[]
  children: React.ReactNode
}

export function AAPledgeModal({ campaignId, tiers, children }: AAPledgeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [useAA, setUseAA] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("")

  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // Check if AA is available
  const isAAAvailable = AA_UTILS.isEnabled()

  // Get smart account address when wallet is connected
  useEffect(() => {
    async function getSmartAccountAddress() {
      if (walletClient && useAA && isAAAvailable) {
        try {
          const smartAddress = await AA_UTILS.getSmartAccountAddress(walletClient)
          setSmartAccountAddress(smartAddress)
        } catch (error) {
          console.error("Failed to get smart account address:", error)
        }
      }
    }
    getSmartAccountAddress()
  }, [walletClient, useAA, isAAAvailable])

  const selectedTierData = tiers.find((t) => t.id === selectedTier)
  const amountInWei = amount ? parseUnits(amount, 6) : 0n

  const handleAAPledge = async () => {
    if (!walletClient || !selectedTierData) {
      toast.error("Wallet not connected or tier not selected")
      return
    }

    setIsProcessing(true)

    try {
      // Create smart account client
      const smartAccountClient = await createSmartAccount(walletClient)

      // Prepare batch transaction: approve + pledge
      const approveCallData = encodeFunctionData({
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [ESCROW_VAULT_ADDRESS, amountInWei],
      })

      const pledgeCallData = encodeFunctionData({
        abi: ESCROW_VAULT_ABI,
        functionName: "pledge",
        args: [BigInt(campaignId), amountInWei],
      })

      // Batch both operations into single user operation
      const calls = [
        {
          to: MOCK_USDC_ADDRESS,
          data: approveCallData,
          value: 0n,
        },
        {
          to: ESCROW_VAULT_ADDRESS,
          data: pledgeCallData,
          value: 0n,
        },
      ]

      // Estimate gas
      const gasEstimate = await AA_UTILS.estimateGas(smartAccountClient, calls)
      console.log("[v0] Gas estimate:", gasEstimate)

      // Send user operation (gasless transaction)
      const userOpHash = await smartAccountClient.sendUserOperation({
        userOperation: {
          callData: await smartAccountClient.account.encodeCallData(calls),
        },
      })

      toast.success("Transaction submitted! Processing...")

      // Wait for transaction to be mined
      const receipt = await smartAccountClient.waitForUserOperationReceipt({
        hash: userOpHash,
      })

      // Update database with transaction
      await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          walletAddress: smartAccountAddress || address,
          amount: Number.parseFloat(amount),
          tierId: selectedTier,
          txHash: receipt.transactionHash,
          status: "CONFIRMED",
          isAA: true,
        }),
      })

      toast.success("Gasless pledge successful! 🎉")
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error("AA pledge failed:", error)
      toast.error("Gasless transaction failed. Try regular transaction.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setSelectedTier("")
    setAmount("")
    setUseAA(true)
  }

  if (!isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet Required</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Please connect your wallet to make a pledge.</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Make a Pledge
            {isAAAvailable && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Gasless Available
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* AA Toggle */}
          {isAAAvailable && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Gasless Transaction</p>
                  <p className="text-xs text-muted-foreground">No gas fees required</p>
                </div>
              </div>
              <Button variant={useAA ? "default" : "outline"} size="sm" onClick={() => setUseAA(!useAA)}>
                {useAA ? "Enabled" : "Disabled"}
              </Button>
            </div>
          )}

          {/* Smart Account Address */}
          {useAA && smartAccountAddress && (
            <div className="text-xs text-muted-foreground">
              <p>
                Smart Account: {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
              </p>
            </div>
          )}

          {/* Tier Selection */}
          <div>
            <Label htmlFor="tier">Select Tier</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name} (Min: ${tier.minAmount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier Details */}
          {selectedTierData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selectedTierData.name}</CardTitle>
                <CardDescription className="text-xs">{selectedTierData.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  <strong>Rewards:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {selectedTierData.rewards.map((reward, i) => (
                      <li key={i}>{reward}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Amount (USDC)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min={selectedTierData?.minAmount || 0}
              />
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={
              useAA && isAAAvailable
                ? handleAAPledge
                : () => toast.info("Regular pledge flow not implemented in this modal")
            }
            disabled={!selectedTier || !amount || isProcessing}
            className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {useAA && isAAAvailable ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Gasless Pledge
              </>
            ) : (
              "Regular Pledge"
            )}
          </Button>

          {/* AA Benefits */}
          {useAA && isAAAvailable && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                No gas fees - transaction sponsored
              </p>
              <p className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Single transaction (approve + pledge combined)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
