"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, DollarSign, AlertCircle } from "lucide-react"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PledgeModalV2Props {
  campaignId: bigint
  campaignTitle: string
  onClose: () => void
  onSuccess?: () => void
}

export function PledgeModalV2({ campaignId, campaignTitle, onClose, onSuccess }: PledgeModalV2Props) {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "approve" | "pledge">("input")

  const { isConnected } = useAccount()

  const campaignIdNumber = Number(campaignId)

  const {
    campaignData,
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
    pledgeHash,
    pledgeError,
    escrowAddress,
    usdcAddress,
  } = useCampaignContract(campaignIdNumber)

  const campaignExistsOnChain = campaignData && campaignData.creator !== "0x0000000000000000000000000000000000000000"

  useEffect(() => {
    if (campaignData) {
      const creator = campaignData.creator
      const goalAmount = campaignData.goal
      const totalPledged = campaignData.totalPledged
      const deadline = campaignData.deadline
      const finalized = campaignData.finalized

      const now = Math.floor(Date.now() / 1000)
      const deadlineNumber = Number(deadline)
      const isExpired = deadlineNumber > 0 ? deadlineNumber < now : false
      const deadlineDate = deadlineNumber > 0 ? new Date(deadlineNumber * 1000).toISOString() : "Not set"

      console.log("[v0] Campaign blockchain state:", {
        campaignId: campaignIdNumber,
        exists: campaignExistsOnChain,
        creator,
        goalAmount: goalAmount?.toString(),
        goalInUSDC: goalAmount ? formatUnits(goalAmount, 6) : "0",
        totalPledged: totalPledged?.toString(),
        pledgedInUSDC: totalPledged ? formatUnits(totalPledged, 6) : "0",
        deadline: deadline?.toString(),
        deadlineDate,
        isExpired,
        finalized,
        currentTimestamp: now,
      })
    }

    if (usdcBalance !== undefined && usdcAllowance !== undefined) {
      console.log("[v0] USDC state:", {
        balance: usdcBalance.toString(),
        balanceInUSDC: formatUnits(usdcBalance, 6),
        allowance: usdcAllowance.toString(),
        allowanceInUSDC: formatUnits(usdcAllowance, 6),
        usdcAddress,
        escrowAddress,
      })
    }
  }, [campaignData, campaignExistsOnChain, campaignIdNumber, usdcBalance, usdcAllowance, usdcAddress, escrowAddress])

  console.log("[v0] Pledge modal opened for campaign:", campaignIdNumber)

  const amountInWei = amount ? BigInt(Number.parseFloat(amount) * 1e6) : 0n
  const hasEnoughBalance = usdcBalance ? usdcBalance >= amountInWei : false
  const hasEnoughAllowance = usdcAllowance ? usdcAllowance >= amountInWei : false

  const resetForm = () => {
    setAmount("")
    setStep("input")
  }

  useEffect(() => {
    if (isApproveSuccess && step === "approve") {
      console.log("[v0] Approval successful, advancing to pledge step")
      setStep("pledge")
    }
  }, [isApproveSuccess, step])

  useEffect(() => {
    if (isPledgeSuccess) {
      console.log("[v0] Pledge successful, closing modal in 2 seconds")
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        onClose()
        resetForm()
      }, 2000)
    }
  }, [isPledgeSuccess, onClose, onSuccess])

  const handleConfirmPledge = () => {
    console.log("[v0] Confirm Pledge clicked - Full state:", {
      campaignIdNumber,
      amount,
      amountInWei: amountInWei.toString(),
      step,
      isPledgePending,
      isPledgeLoading,
      hasEnoughAllowance,
      hasEnoughBalance,
      campaignExistsOnChain,
      usdcBalance: usdcBalance?.toString(),
      usdcAllowance: usdcAllowance?.toString(),
      escrowAddress,
      usdcAddress,
    })

    if (!amount || Number.parseFloat(amount) <= 0) {
      console.error("[v0] Invalid amount:", amount)
      return
    }

    if (!hasEnoughBalance) {
      console.error("[v0] Insufficient USDC balance:", {
        required: amountInWei.toString(),
        available: usdcBalance?.toString(),
      })
      return
    }

    if (!hasEnoughAllowance) {
      console.error("[v0] Insufficient allowance:", {
        required: amountInWei.toString(),
        approved: usdcAllowance?.toString(),
      })
      return
    }

    if (!campaignExistsOnChain) {
      console.error("[v0] Campaign does not exist on blockchain")
      return
    }

    console.log("[v0] All validations passed, calling handlePledge...")
    handlePledge(campaignIdNumber, amount)
    console.log("[v0] handlePledge called")
  }

  if (!isConnected) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Back {campaignTitle}</DialogTitle>
        </DialogHeader>

        {!campaignExistsOnChain && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This campaign does not exist on the blockchain yet. The campaign creator needs to deploy it on-chain
              before you can pledge.
            </AlertDescription>
          </Alert>
        )}

        {pledgeError && step === "pledge" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{pledgeError.message}</AlertDescription>
          </Alert>
        )}

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
                  disabled={!campaignExistsOnChain}
                />
              </div>
              {usdcBalance && (
                <p className="text-xs text-muted-foreground mt-1">Balance: {formatUnits(usdcBalance, 6)} USDC</p>
              )}
            </div>

            <Button
              onClick={() => setStep("approve")}
              disabled={!amount || !hasEnoughBalance || Number.parseFloat(amount) <= 0 || !campaignExistsOnChain}
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
              onClick={handleConfirmPledge}
              disabled={isPledgePending || isPledgeLoading || !campaignExistsOnChain}
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
