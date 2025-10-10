"use client"

import type React from "react"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { MOCK_USDC_ADDRESS, ESCROW_VAULT_ADDRESS, MOCK_USDC_ABI, ESCROW_VAULT_ABI } from "@/lib/wagmi"

interface Tier {
  id: string
  name: string
  minAmount: number
  description: string
  rewards: string[]
}

interface PledgeModalProps {
  campaignId: number
  tiers: Tier[]
  children: React.ReactNode
}

export function PledgeModal({ campaignId, tiers, children }: PledgeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"select" | "approve" | "pledge">("select")

  const { address, isConnected } = useAccount()

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  // Check USDC allowance
  const { data: allowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address && ESCROW_VAULT_ADDRESS ? [address, ESCROW_VAULT_ADDRESS] : undefined,
  })

  // Approve USDC spending
  const { writeContract: approveUsdc, data: approveHash, isPending: isApprovePending } = useWriteContract()

  // Wait for approval transaction
  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Pledge to campaign
  const { writeContract: pledgeToCampaign, data: pledgeHash, isPending: isPledgePending } = useWriteContract()

  // Wait for pledge transaction
  const { isLoading: isPledgeLoading } = useWaitForTransactionReceipt({
    hash: pledgeHash,
    onSuccess: async () => {
      // Update database with transaction hash
      try {
        await fetch("/api/pledges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            walletAddress: address,
            amount: Number.parseFloat(amount),
            tierId: selectedTier,
            txHash: pledgeHash,
            status: "CONFIRMED",
          }),
        })
        toast.success("Pledge successful!")
        setIsOpen(false)
        resetForm()
      } catch (error) {
        console.error("Failed to update pledge in database:", error)
        toast.error("Pledge completed but failed to update database")
      }
    },
  })

  const resetForm = () => {
    setSelectedTier("")
    setAmount("")
    setStep("select")
  }

  const selectedTierData = tiers.find((t) => t.id === selectedTier)
  const amountInWei = amount ? parseUnits(amount, 6) : 0n // USDC has 6 decimals
  const hasEnoughBalance = balance ? balance >= amountInWei : false
  const hasEnoughAllowance = allowance ? allowance >= amountInWei : false

  const handleApprove = () => {
    if (!MOCK_USDC_ADDRESS || !ESCROW_VAULT_ADDRESS) {
      toast.error("Contract addresses not configured")
      return
    }

    approveUsdc({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [ESCROW_VAULT_ADDRESS, amountInWei],
    })
  }

  const handlePledge = () => {
    if (!ESCROW_VAULT_ADDRESS) {
      toast.error("Escrow vault address not configured")
      return
    }

    pledgeToCampaign({
      address: ESCROW_VAULT_ADDRESS,
      abi: ESCROW_VAULT_ABI,
      functionName: "pledge",
      args: [BigInt(campaignId), amountInWei],
    })
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
          <DialogTitle>Make a Pledge</DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
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
              {balance && <p className="text-xs text-muted-foreground mt-1">Balance: {formatUnits(balance, 6)} USDC</p>}
            </div>

            <Button
              onClick={() => setStep("approve")}
              disabled={!selectedTier || !amount || !hasEnoughBalance}
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
            >
              Continue
            </Button>
          </div>
        )}

        {step === "approve" && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold">Approve USDC Spending</h3>
              <p className="text-sm text-muted-foreground">Allow the escrow contract to spend {amount} USDC</p>
            </div>

            {!hasEnoughAllowance ? (
              <Button
                onClick={handleApprove}
                disabled={isApprovePending || isApproveLoading}
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
              >
                {(isApprovePending || isApproveLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve USDC
              </Button>
            ) : (
              <Button
                onClick={() => setStep("pledge")}
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
              >
                Continue to Pledge
              </Button>
            )}
          </div>
        )}

        {step === "pledge" && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold">Confirm Pledge</h3>
              <p className="text-sm text-muted-foreground">Pledge {amount} USDC to this campaign</p>
            </div>

            <Button
              onClick={handlePledge}
              disabled={isPledgePending || isPledgeLoading}
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
            >
              {(isPledgePending || isPledgeLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Pledge
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
