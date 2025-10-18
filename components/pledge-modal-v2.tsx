"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, DollarSign, AlertCircle, Check } from "lucide-react"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCampaignTiers } from "@/lib/actions/campaigns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PledgeModalV2Props {
  campaignId: bigint
  campaignTitle: string
  campaignDbId: string
  onClose: () => void
  onSuccess?: (pledgeData: { hash: string; amount: string; backerAddress: string; tierId?: string }) => void
}

interface Tier {
  id: string
  title: string
  description: string
  amount: number
  rewards: string[]
  max_backers: number | null
  is_limited: boolean
  estimated_delivery: string | null
  shipping_cost: number | null
}

export function PledgeModalV2({ campaignId, campaignTitle, campaignDbId, onClose, onSuccess }: PledgeModalV2Props) {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "approve" | "pledge">("input")
  const [tiers, setTiers] = useState<Tier[]>([])
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState(false)

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
    refetchAllowance,
  } = useCampaignContract(campaignIdNumber)

  const campaignExistsOnChain = campaignData && campaignData.creator !== "0x0000000000000000000000000000000000000000"

  const amountInWei = amount ? BigInt(Number.parseFloat(amount) * 1e6) : 0n
  const hasEnoughBalance = usdcBalance ? usdcBalance >= amountInWei : false
  const hasEnoughAllowance = usdcAllowance ? usdcAllowance >= amountInWei : false

  useEffect(() => {
    const loadTiers = async () => {
      const fetchedTiers = await getCampaignTiers(campaignDbId)
      setTiers(fetchedTiers)
      console.log("[v0] Loaded tiers:", fetchedTiers)
    }
    loadTiers()
  }, [campaignDbId])

  useEffect(() => {
    if (selectedTierId && !customAmount) {
      const selectedTier = tiers.find((t) => t.id === selectedTierId)
      if (selectedTier) {
        setAmount(selectedTier.amount.toString())
      }
    }
  }, [selectedTierId, tiers, customAmount])

  const resetForm = () => {
    setAmount("")
    setStep("input")
    setSelectedTierId(null)
    setCustomAmount(false)
  }

  useEffect(() => {
    if (step === "pledge" && !hasEnoughAllowance && amountInWei > 0n) {
      setStep("approve")
    }
  }, [step, hasEnoughAllowance, amountInWei])

  useEffect(() => {
    if (isApproveSuccess && step === "approve") {
      const checkAllowance = async () => {
        await refetchAllowance()
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
            tierId: selectedTierId || undefined,
          })
        }
        onClose()
        resetForm()
      }, 2000)
    }
  }, [isPledgeSuccess, pledgeHash, address, amount, selectedTierId, onClose, onSuccess])

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

  const minPledgeAmount = tiers.length > 0 ? Math.min(...tiers.map((t) => t.amount)) : 0

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
            {tiers.length > 0 && (
              <div className="space-y-3">
                <Label>Select a Reward Tier</Label>
                <RadioGroup
                  value={selectedTierId || ""}
                  onValueChange={(value) => {
                    setSelectedTierId(value)
                    setCustomAmount(false)
                  }}
                >
                  {tiers.map((tier) => (
                    <Card
                      key={tier.id}
                      className={`cursor-pointer transition-all ${
                        selectedTierId === tier.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-muted-foreground/20"
                      }`}
                      onClick={() => {
                        setSelectedTierId(tier.id)
                        setCustomAmount(false)
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value={tier.id} id={tier.id} />
                              <CardTitle className="text-base">{tier.title}</CardTitle>
                            </div>
                            <CardDescription className="mt-1">{tier.description}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">${tier.amount}</div>
                            {tier.is_limited && tier.max_backers && (
                              <div className="text-xs text-muted-foreground">Limited: {tier.max_backers} spots</div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {tier.rewards && tier.rewards.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                            {tier.rewards.map((reward, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{reward}</span>
                              </div>
                            ))}
                          </div>
                          {tier.estimated_delivery && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Estimated delivery: {new Date(tier.estimated_delivery).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </RadioGroup>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Card
                  className={`cursor-pointer transition-all ${
                    customAmount ? "border-primary ring-2 ring-primary/20" : "hover:border-muted-foreground/20"
                  }`}
                  onClick={() => {
                    setCustomAmount(true)
                    setSelectedTierId(null)
                    setAmount("")
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="custom"
                        id="custom"
                        checked={customAmount}
                        onClick={() => {
                          setCustomAmount(true)
                          setSelectedTierId(null)
                        }}
                      />
                      <CardTitle className="text-base">Pledge without a reward</CardTitle>
                    </div>
                    <CardDescription>Enter a custom amount to support this project</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}

            {(customAmount || tiers.length === 0) && (
              <div>
                <Label htmlFor="amount">Amount (USDC)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder={minPledgeAmount > 0 ? `Minimum: ${minPledgeAmount}` : "0.00"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    min={minPledgeAmount}
                    step="0.01"
                    disabled={!campaignExistsOnChain}
                  />
                </div>
                {usdcBalance && (
                  <p className="text-xs text-muted-foreground mt-1">Balance: {formatUnits(usdcBalance, 6)} USDC</p>
                )}
                {minPledgeAmount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Minimum pledge: ${minPledgeAmount}</p>
                )}
              </div>
            )}

            <Button
              onClick={() => setStep("approve")}
              disabled={
                !amount ||
                !hasEnoughBalance ||
                Number.parseFloat(amount) <= 0 ||
                (minPledgeAmount > 0 && Number.parseFloat(amount) < minPledgeAmount) ||
                !campaignExistsOnChain
              }
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
