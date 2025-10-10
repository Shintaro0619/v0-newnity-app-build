"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Send, Loader2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { getContractAddress } from "@/lib/wagmi"
import { ADVANCED_ESCROW_ABI } from "@/lib/advanced-contracts"
import { RiskManager } from "@/lib/advanced-contracts"

interface Recipient {
  address: string
  amount: string
  label: string
}

interface AutomatedDistributionProps {
  campaignId: number
  totalFunds: number
  isCreator: boolean
  campaignData: {
    goalAmount: number
    duration: number
    creatorReputation: number
    milestoneCount: number
  }
}

export function AutomatedDistribution({ campaignId, totalFunds, isCreator, campaignData }: AutomatedDistributionProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: "", amount: "", label: "Team Member 1" }])
  const [isDistributing, setIsDistributing] = useState(false)

  const { address, chain } = useAccount()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })

  // Get contract address for current chain
  const escrowAddress = chain ? getContractAddress(chain.id, "ESCROW_VAULT") : undefined

  // Calculate risk score and recommended distribution
  const riskScore = RiskManager.calculateRiskScore(campaignData)
  const recommendedSchedule = RiskManager.getRecommendedReleaseSchedule(riskScore, totalFunds)

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", amount: "", label: `Team Member ${recipients.length + 1}` }])
  }

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients]
    updated[index] = { ...updated[index], [field]: value }
    setRecipients(updated)
  }

  const getTotalDistribution = () => {
    return recipients.reduce((sum, recipient) => {
      const amount = Number.parseFloat(recipient.amount) || 0
      return sum + amount
    }, 0)
  }

  const handleDistribute = async () => {
    if (!escrowAddress) {
      toast.error("Contract not available")
      return
    }

    // Validate recipients
    const validRecipients = recipients.filter((r) => r.address && r.amount && Number.parseFloat(r.amount) > 0)
    if (validRecipients.length === 0) {
      toast.error("Please add at least one valid recipient")
      return
    }

    const totalDistribution = getTotalDistribution()
    if (totalDistribution > totalFunds) {
      toast.error("Total distribution exceeds available funds")
      return
    }

    setIsDistributing(true)
    try {
      const addresses = validRecipients.map((r) => r.address as `0x${string}`)
      const amounts = validRecipients.map((r) => r.amount)

      await writeContract({
        address: escrowAddress,
        abi: ADVANCED_ESCROW_ABI,
        functionName: "distributeFunds",
        args: [BigInt(campaignId), addresses, amounts.map((a) => BigInt(Number.parseFloat(a) * 1e6))],
      })

      toast.success("Automated distribution initiated!")
    } catch (error) {
      console.error("Distribution failed:", error)
      toast.error("Failed to distribute funds")
    } finally {
      setIsDistributing(false)
    }
  }

  const applyRecommendedDistribution = () => {
    // Apply recommended distribution based on risk assessment
    const newRecipients: Recipient[] = [
      {
        address: address || "",
        amount: recommendedSchedule.upfront.toString(),
        label: "Creator (Upfront)",
      },
    ]

    recommendedSchedule.milestoneReleases.forEach((amount, index) => {
      newRecipients.push({
        address: "",
        amount: amount.toString(),
        label: `Milestone ${index + 1} Release`,
      })
    })

    setRecipients(newRecipients)
    toast.info(`Applied ${recommendedSchedule.schedule} distribution schedule`)
  }

  if (!isCreator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Distribution</CardTitle>
          <CardDescription>Only campaign creators can manage fund distribution</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Risk Assessment
            <Badge variant={riskScore > 70 ? "destructive" : riskScore > 40 ? "secondary" : "default"}>
              {riskScore > 70 ? "High Risk" : riskScore > 40 ? "Medium Risk" : "Low Risk"}
            </Badge>
          </CardTitle>
          <CardDescription>Automated risk analysis for optimal fund distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Risk Score</p>
              <p className="text-2xl font-bold">{riskScore}/100</p>
            </div>
            <div>
              <p className="text-sm font-medium">Recommended Strategy</p>
              <p className="text-sm text-muted-foreground">{recommendedSchedule.schedule}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended Distribution:</p>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <p className="text-sm">Upfront: ${recommendedSchedule.upfront.toFixed(2)}</p>
              <p className="text-sm">
                Milestone Releases: {recommendedSchedule.milestoneReleases.length} payments of $
                {recommendedSchedule.milestoneReleases[0]?.toFixed(2)} each
              </p>
            </div>
          </div>

          <Button onClick={applyRecommendedDistribution} variant="outline" className="w-full bg-transparent">
            Apply Recommended Distribution
          </Button>
        </CardContent>
      </Card>

      {/* Distribution Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Automated Distribution
          </CardTitle>
          <CardDescription>Set up automated fund distribution to team members and milestones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Funds */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Available Funds</span>
            </div>
            <span className="text-lg font-bold">${totalFunds.toLocaleString()}</span>
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Distribution Recipients</Label>
              <Button onClick={addRecipient} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>

            {recipients.map((recipient, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{recipient.label}</Label>
                    {recipients.length > 1 && (
                      <Button
                        onClick={() => removeRecipient(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`address-${index}`}>Wallet Address</Label>
                      <Input
                        id={`address-${index}`}
                        placeholder="0x..."
                        value={recipient.address}
                        onChange={(e) => updateRecipient(index, "address", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`amount-${index}`}>Amount (USDC)</Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        placeholder="0.00"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(index, "amount", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`label-${index}`}>Label</Label>
                    <Input
                      id={`label-${index}`}
                      placeholder="Team member, contractor, etc."
                      value={recipient.label}
                      onChange={(e) => updateRecipient(index, "label", e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Distribution Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Distribution:</span>
              <span className="text-lg font-bold">${getTotalDistribution().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Remaining Funds:</span>
              <span>${(totalFunds - getTotalDistribution()).toFixed(2)}</span>
            </div>
          </div>

          {/* Execute Distribution */}
          <Button
            onClick={handleDistribute}
            disabled={
              getTotalDistribution() === 0 ||
              getTotalDistribution() > totalFunds ||
              isDistributing ||
              isPending ||
              isTxLoading
            }
            className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
          >
            {(isDistributing || isPending || isTxLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Execute Distribution
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
