"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, DollarSign, Network, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  getContractAddress,
  getChainName,
  isChainSupported,
  SUPPORTED_CHAINS,
  MOCK_USDC_ABI,
  ESCROW_VAULT_ABI,
} from "@/lib/wagmi"

interface Tier {
  id: string
  name: string
  minAmount: number
  description: string
  rewards: string[]
}

interface MultiChainPledgeModalProps {
  campaignId: number
  tiers: Tier[]
  supportedChains?: number[] // Chains this campaign supports
  children: React.ReactNode
}

export function MultiChainPledgeModal({ campaignId, tiers, supportedChains, children }: MultiChainPledgeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [selectedChainId, setSelectedChainId] = useState<number>()
  const [step, setStep] = useState<"select" | "approve" | "pledge">("select")

  const { address, isConnected, chain } = useAccount()
  const { switchChain } = useSwitchChain()

  // Filter supported chains for this campaign
  const availableChains = SUPPORTED_CHAINS.filter((c) => !supportedChains || supportedChains.includes(c.id))

  // Set default chain
  useEffect(() => {
    if (!selectedChainId && chain && isChainSupported(chain.id)) {
      setSelectedChainId(chain.id)
    } else if (!selectedChainId && availableChains.length > 0) {
      setSelectedChainId(availableChains[0].id)
    }
  }, [chain, selectedChainId, availableChains])

  // Get contract addresses for selected chain
  const usdcAddress = selectedChainId ? getContractAddress(selectedChainId, "MOCK_USDC") : undefined
  const escrowAddress = selectedChainId ? getContractAddress(selectedChainId, "ESCROW_VAULT") : undefined

  // Check USDC balance on selected chain
  const { data: balance } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: selectedChainId,
  })

  // Check USDC allowance on selected chain
  const { data: allowance } = useReadContract({
    address: usdcAddress,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: address && escrowAddress ? [address, escrowAddress] : undefined,
    chainId: selectedChainId,
  })

  // Approve USDC spending
  const { writeContract: approveUsdc, data: approveHash, isPending: isApprovePending } = useWriteContract()

  // Wait for approval transaction
  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
    chainId: selectedChainId,
  })

  // Pledge to campaign
  const { writeContract: pledgeToCampaign, data: pledgeHash, isPending: isPledgePending } = useWriteContract()

  // Wait for pledge transaction
  const { isLoading: isPledgeLoading } = useWaitForTransactionReceipt({
    hash: pledgeHash,
    chainId: selectedChainId,
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
            chainId: selectedChainId,
            status: "CONFIRMED",
          }),
        })
        toast.success(`Pledge successful on ${getChainName(selectedChainId!)}!`)
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
  const needsChainSwitch = chain?.id !== selectedChainId

  const handleChainSwitch = async () => {
    if (!selectedChainId) return
    try {
      await switchChain({ chainId: selectedChainId })
    } catch (error) {
      console.error("Chain switch failed:", error)
      toast.error("Failed to switch network")
    }
  }

  const handleApprove = () => {
    if (!usdcAddress || !escrowAddress) {
      toast.error("Contract addresses not configured for this chain")
      return
    }

    approveUsdc({
      address: usdcAddress,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [escrowAddress, amountInWei],
      chainId: selectedChainId,
    })
  }

  const handlePledge = () => {
    if (!escrowAddress) {
      toast.error("Escrow vault address not configured for this chain")
      return
    }

    pledgeToCampaign({
      address: escrowAddress,
      abi: ESCROW_VAULT_ABI,
      functionName: "pledge",
      args: [BigInt(campaignId), amountInWei],
      chainId: selectedChainId,
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
          <DialogTitle className="flex items-center gap-2">
            Multi-Chain Pledge
            <Badge variant="secondary" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              {availableChains.length} Chains
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {/* Chain Selection */}
            <div>
              <Label htmlFor="chain">Select Network</Label>
              <Select value={selectedChainId?.toString()} onValueChange={(value) => setSelectedChainId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a network" />
                </SelectTrigger>
                <SelectContent>
                  {availableChains.map((chainConfig) => (
                    <SelectItem key={chainConfig.id} value={chainConfig.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        {chainConfig.name}
                        {chain?.id === chainConfig.id && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chain Switch Warning */}
            {needsChainSwitch && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">You need to switch to {getChainName(selectedChainId!)} to continue</p>
                  </div>
                  <Button
                    onClick={handleChainSwitch}
                    size="sm"
                    className="mt-2 w-full bg-transparent"
                    variant="outline"
                  >
                    Switch to {getChainName(selectedChainId!)}
                  </Button>
                </CardContent>
              </Card>
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
              {balance && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {formatUnits(balance, 6)} USDC on {getChainName(selectedChainId!)}
                </p>
              )}
            </div>

            <Button
              onClick={() => setStep("approve")}
              disabled={!selectedTier || !amount || !hasEnoughBalance || needsChainSwitch}
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
            >
              Continue
            </Button>
          </div>
        )}

        {/* ... existing approve and pledge steps ... */}
        {step === "approve" && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold">Approve USDC Spending</h3>
              <p className="text-sm text-muted-foreground">
                Allow the escrow contract to spend {amount} USDC on {getChainName(selectedChainId!)}
              </p>
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
              <p className="text-sm text-muted-foreground">
                Pledge {amount} USDC to this campaign on {getChainName(selectedChainId!)}
              </p>
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
