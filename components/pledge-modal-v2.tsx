"use client"

import type React from "react"

import { useState } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, DollarSign } from "lucide-react"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"

interface PledgeModalV2Props {
  campaignId: number
  children: React.ReactNode
}

export function PledgeModalV2({ campaignId, children }: PledgeModalV2Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "approve" | "pledge">("input")

  const { isConnected } = useAccount()
  const {
    usdcBalance,
    usdcAllowance,
    handleApprove,
    isApprovePending,
    isApproveLoading,
    isApproveSuccess,
    handlePledge,
    isPledgePending,
    isPledgeLoading,
    isPledgeSuccess,
  } = useCampaignContract(campaignId)

  const amountInWei = amount ? BigInt(Number.parseFloat(amount) * 1e6) : 0n
  const hasEnoughBalance = usdcBalance ? usdcBalance >= amountInWei : false
  const hasEnoughAllowance = usdcAllowance ? usdcAllowance >= amountInWei : false

  const resetForm = () => {
    setAmount("")
    setStep("input")
  }

  // Auto-advance after approval
  if (isApproveSuccess && step === "approve") {
    setStep("pledge")
  }

  // Close modal after successful pledge
  if (isPledgeSuccess && isOpen) {
    setTimeout(() => {
      setIsOpen(false)
      resetForm()
    }, 2000)
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

        {step === "input" && (
          <div className="space-y-4">
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
                  min={0}
                  step="0.01"
                />
              </div>
              {usdcBalance && (
                <p className="text-xs text-muted-foreground mt-1">Balance: {formatUnits(usdcBalance, 6)} USDC</p>
              )}
            </div>

            <Button
              onClick={() => setStep("approve")}
              disabled={!amount || !hasEnoughBalance || Number.parseFloat(amount) <= 0}
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === "approve" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 1: Approve USDC</CardTitle>
                <CardDescription>Allow the escrow contract to spend {amount} USDC</CardDescription>
              </CardHeader>
            </Card>

            {!hasEnoughAllowance ? (
              <Button
                onClick={() => handleApprove(amount)}
                disabled={isApprovePending || isApproveLoading}
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
              >
                {(isApprovePending || isApproveLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve USDC
              </Button>
            ) : (
              <Button
                onClick={() => setStep("pledge")}
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
              >
                Continue to Pledge
              </Button>
            )}
          </div>
        )}

        {step === "pledge" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 2: Confirm Pledge</CardTitle>
                <CardDescription>Pledge {amount} USDC to this campaign</CardDescription>
              </CardHeader>
            </Card>

            <Button
              onClick={() => handlePledge(campaignId, amount)}
              disabled={isPledgePending || isPledgeLoading}
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              {(isPledgePending || isPledgeLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPledgeSuccess ? "Pledge Successful!" : "Confirm Pledge"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
