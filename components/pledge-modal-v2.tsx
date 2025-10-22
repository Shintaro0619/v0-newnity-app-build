"use client"

import { Alert } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, DollarSign, AlertCircle, Check, Clock } from "lucide-react"
import { useCampaignContract } from "@/lib/hooks/use-campaign-contract"
import { getCampaignTiers } from "@/lib/actions/campaigns"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { isTierAvailable, getTierStatusMessage, fromAtomicUsdc, formatUSDC } from "@/lib/utils/tier-utils"
import { usdcToUsd } from "@/lib/utils/money"

interface PledgeModalV2Props {
  campaignId: bigint
  campaignTitle: string
  campaignDbId: string
  minContribution?: number // Add minimum contribution prop (in USDC atomic units)
  onClose: () => void
  onSuccess?: (pledgeData: { hash: string; amount: string; backerAddress: string; tierId?: string }) => void
}

interface Tier {
  id: string
  title: string
  description: string
  amount: number // This is in USDC (not atomic)
  rewards: string[]
  is_limited: boolean
  is_active?: boolean // Add is_active flag
  estimated_delivery: string | null
  shipping_cost: number | null
  starts_at?: string | null // Add time constraints
  ends_at?: string | null
  sort_order?: number // Add sort order
  max_backers?: number | null // Add max_backers
  minted?: number | null // Add minted count
}

export function PledgeModalV2({
  campaignId,
  campaignTitle,
  campaignDbId,
  minContribution = 1000000, // Default 1 USDC in atomic units
  onClose,
  onSuccess,
}: PledgeModalV2Props) {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"input" | "approve" | "pledge">("input")
  const [tiers, setTiers] = useState<Tier[]>([])
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState(false)
  const [nowUtcSec, setNowUtcSec] = useState(Math.floor(Date.now() / 1000))

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
    const interval = setInterval(() => {
      setNowUtcSec(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadTiers = async () => {
      const fetchedTiers = await getCampaignTiers(campaignDbId)
      setTiers(fetchedTiers)
      console.log("[v0] Loaded tiers:", fetchedTiers)
    }
    loadTiers()
  }, [campaignDbId])

  const minAmountUsd = usdcToUsd(minContribution)

  useEffect(() => {
    if (selectedTierId && !customAmount) {
      const selectedTier = tiers.find((t) => t.id === selectedTierId)
      if (selectedTier) {
        setAmount(selectedTier.amount.toString())
      }
    } else if (customAmount) {
      setAmount(minAmountUsd.toString())
    }
  }, [selectedTierId, tiers, customAmount, minAmountUsd])

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

    const selectedTier = tiers.find((t) => t.id === selectedTierId)
    const minAmount = selectedTier ? selectedTier.amount : minAmountUsd
    if (Number.parseFloat(amount) < minAmount) {
      alert(`Minimum pledge amount is $${minAmount}`)
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

  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order
    }
    return a.amount - b.amount
  })

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
            <div className="text-sm mt-2">
              This campaign does not exist on the blockchain yet. The campaign creator needs to deploy it on-chain
              before you can pledge.
            </div>
          </Alert>
        )}

        {pledgeError && step === "pledge" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <div className="text-sm mt-2">{pledgeError.message}</div>
          </Alert>
        )}

        {step === "input" && (
          <div className="space-y-4">
            {tiers.length > 0 && (
              <div className="space-y-3">
                <Label>Select a Reward Tier</Label>
                <RadioGroup
                  value={customAmount ? "custom" : selectedTierId || ""}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setCustomAmount(true)
                      setSelectedTierId(null)
                    } else {
                      setSelectedTierId(value)
                      setCustomAmount(false)
                    }
                  }}
                >
                  {sortedTiers.map((tier) => {
                    const available = isTierAvailable(tier, nowUtcSec)
                    const statusMessage = getTierStatusMessage(tier, nowUtcSec)
                    const isSoldOut =
                      tier.is_limited &&
                      tier.max_backers !== null &&
                      tier.max_backers !== undefined &&
                      (tier.minted || 0) >= tier.max_backers
                    const isAvailable = available && !isSoldOut

                    return (
                      <Card
                        key={tier.id}
                        className={`cursor-pointer transition-all ${
                          selectedTierId === tier.id
                            ? "border-primary ring-2 ring-primary/20"
                            : isAvailable
                              ? "hover:border-muted-foreground/20"
                              : "opacity-60 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedTierId(tier.id)
                            setCustomAmount(false)
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value={tier.id} id={tier.id} disabled={!isAvailable} />
                                <CardTitle className="text-base">{tier.title}</CardTitle>
                                {isSoldOut && (
                                  <Badge variant="destructive" className="text-xs">
                                    Sold Out
                                  </Badge>
                                )}
                                {statusMessage && !isSoldOut && (
                                  <Badge variant={available ? "secondary" : "destructive"} className="text-xs">
                                    {statusMessage}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription
                                className="mt-1"
                                dangerouslySetInnerHTML={{ __html: tier.description }}
                              />
                              {tier.is_limited && tier.max_backers !== null && tier.max_backers !== undefined && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {isSoldOut
                                    ? `All ${tier.max_backers} claimed`
                                    : `${tier.max_backers - (tier.minted || 0)} of ${tier.max_backers} remaining`}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-primary">${formatUSDC(tier.amount)}</div>
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
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Estimated delivery: {new Date(tier.estimated_delivery).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}

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
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <CardTitle className="text-base">Pledge without a reward</CardTitle>
                          </div>
                          <CardDescription>Support this project with a custom amount</CardDescription>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-muted-foreground">
                            Min ${formatUSDC(fromAtomicUsdc(minContribution))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </RadioGroup>
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
                    placeholder={`Minimum: ${formatUSDC(minAmountUsd)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    min={minAmountUsd}
                    step="0.01"
                    disabled={!campaignExistsOnChain}
                  />
                </div>
                {usdcBalance && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance: {formatUSDC(formatUnits(usdcBalance, 6))} USDC
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Minimum pledge: ${formatUSDC(minAmountUsd)}</p>
              </div>
            )}

            {selectedTierId && !customAmount && (
              <div>
                <Label htmlFor="tier-amount">Pledge Amount (USDC)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="tier-amount" type="text" value={amount} className="pl-10 bg-muted" disabled />
                </div>
                {usdcBalance && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance: {formatUSDC(formatUnits(usdcBalance, 6))} USDC
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  This tier requires a pledge of ${formatUSDC(amount)}
                </p>
              </div>
            )}

            <Button
              onClick={() => setStep("approve")}
              disabled={
                !amount ||
                !hasEnoughBalance ||
                Number.parseFloat(amount) <= 0 ||
                Number.parseFloat(amount) <
                  (selectedTierId ? tiers.find((t) => t.id === selectedTierId)?.amount || 0 : minAmountUsd) ||
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
                <CardDescription>Allow the escrow contract to spend {Math.floor(Number(amount))} USDC</CardDescription>
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
                <CardDescription>Pledge {formatUSDC(amount)} USDC to this campaign</CardDescription>
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
