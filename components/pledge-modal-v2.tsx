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
  onSuccess?: (pledgeData: { hash: string; amount: string; backerAddress: string }) => void
}

export function PledgeModalV2({ campaignId, campaignTitle, onClose, onSuccess }: PledgeModalV2Props) {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "approve" | "pledge">("input")

  const { isConnected, address } = useAccount()

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
    refetchAllowance, // Added refetchAllowance to manually refresh allowance
  } = useCampaignContract(campaignIdNumber)

  const campaignExistsOnChain = campaignData && campaignData.creator !== "0x0000000000000000000000000000000000000000"

  const amountInWei = amount ? BigInt(Number.parseFloat(amount) * 1e6) : 0n
  const hasEnoughBalance = usdcBalance ? usdcBalance >= amountInWei : false
  const hasEnoughAllowance = usdcAllowance ? usdcAllowance >= amountInWei : false

  const resetForm = () => {
    setAmount("")
    setStep("input")
  }

  useEffect(() => {
    if (step === "pledge" && !hasEnoughAllowance && amountInWei > 0n) {
      setStep("approve")
    }
  }, [step, hasEnoughAllowance, amountInWei])

  useEffect(() => {
    if (isApproveSuccess && step === "approve") {
      // Refetch allowance after approval
      const checkAllowance = async () => {
        await refetchAllowance()
        // Wait a bit for the refetch to complete
        setTimeout(() => {
          if (hasEnoughAllowance) {
            setStep("pledge")
          }
        }, 1000)
      }
      checkAllowance()
    }
  }, [isApproveSuccess, step, hasEnoughAllowance, refetchAllowance])

  useEffect(() => {
    if (isPledgeSuccess && pledgeHash && address) {
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            hash: pledgeHash,
            amount,
            backerAddress: address,
          })
        }
        onClose()
        resetForm()
      }, 2000)
    }
  }, [isPledgeSuccess, pledgeHash, address, amount, onClose, onSuccess])

  const handleConfirmPledge = () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      return
    }

    if (!hasEnoughBalance) {
      return
    }

    if (!hasEnoughAllowance) {
      setStep("approve")
      return
    }

    if (!campaignExistsOnChain) {
      return
    }

    handlePledge(campaignIdNumber, amount)
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
