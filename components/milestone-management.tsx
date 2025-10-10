"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, Upload, Vote, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getContractAddress } from "@/lib/wagmi"
import { ADVANCED_ESCROW_ABI } from "@/lib/advanced-contracts"

interface Milestone {
  id: number
  title: string
  description: string
  targetAmount: number
  targetDate: string
  status: "pending" | "submitted" | "voting" | "approved" | "rejected"
  evidence?: string
  votesFor: number
  votesAgainst: number
  totalVotes: number
}

interface MilestoneManagementProps {
  campaignId: number
  milestones: Milestone[]
  isCreator: boolean
  userVotingPower: number
}

export function MilestoneManagement({ campaignId, milestones, isCreator, userVotingPower }: MilestoneManagementProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  const [evidence, setEvidence] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { address, chain } = useAccount()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })

  // Get contract address for current chain
  const escrowAddress = chain ? getContractAddress(chain.id, "ESCROW_VAULT") : undefined

  // Read campaign status from contract
  const { data: campaignStatus } = useReadContract({
    address: escrowAddress,
    abi: ADVANCED_ESCROW_ABI,
    functionName: "getCampaignStatus",
    args: [BigInt(campaignId)],
  })

  const handleSubmitMilestone = async (milestoneId: number) => {
    if (!escrowAddress || !evidence.trim()) {
      toast.error("Please provide evidence for milestone completion")
      return
    }

    setIsSubmitting(true)
    try {
      await writeContract({
        address: escrowAddress,
        abi: ADVANCED_ESCROW_ABI,
        functionName: "submitMilestone",
        args: [BigInt(campaignId), BigInt(milestoneId), evidence],
      })

      toast.success("Milestone submitted for community review!")
      setEvidence("")
      setSelectedMilestone(null)
    } catch (error) {
      console.error("Milestone submission failed:", error)
      toast.error("Failed to submit milestone")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoteMilestone = async (milestoneId: number, approve: boolean) => {
    if (!escrowAddress) {
      toast.error("Contract not available")
      return
    }

    try {
      await writeContract({
        address: escrowAddress,
        abi: ADVANCED_ESCROW_ABI,
        functionName: "voteMilestone",
        args: [BigInt(campaignId), BigInt(milestoneId), approve],
      })

      toast.success(`Vote ${approve ? "for" : "against"} milestone submitted!`)
    } catch (error) {
      console.error("Voting failed:", error)
      toast.error("Failed to submit vote")
    }
  }

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "voting":
        return <Vote className="h-5 w-5 text-blue-500" />
      case "submitted":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "rejected":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "voting":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const completedMilestones = milestones.filter((m) => m.status === "approved").length
  const totalMilestones = milestones.length
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Milestone Progress
            <Badge variant="outline">
              {completedMilestones}/{totalMilestones} Complete
            </Badge>
          </CardTitle>
          <CardDescription>Track campaign milestone completion and fund release</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedMilestones} milestones completed</span>
              <span>{progressPercentage.toFixed(1)}% progress</span>
            </div>

            {campaignStatus && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm font-medium">Total Pledged</p>
                  <p className="text-2xl font-bold">${Number(campaignStatus[0]) / 1e6}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Funds Released</p>
                  <p className="text-2xl font-bold">${Number(campaignStatus[1]) / 1e6}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone List */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <Card key={milestone.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(milestone.status)}
                  <div>
                    <CardTitle className="text-lg">
                      Milestone {index + 1}: {milestone.title}
                    </CardTitle>
                    <CardDescription>{milestone.description}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Target Amount:</span> ${milestone.targetAmount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Target Date:</span> {milestone.targetDate}
                </div>
              </div>

              {/* Evidence Section */}
              {milestone.evidence && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Submitted Evidence:</p>
                  <p className="text-sm text-muted-foreground">{milestone.evidence}</p>
                </div>
              )}

              {/* Voting Section */}
              {milestone.status === "voting" && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Community Voting</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>For: {milestone.votesFor}</span>
                        <span>Against: {milestone.votesAgainst}</span>
                        <span>Total: {milestone.totalVotes}</span>
                      </div>
                    </div>
                    {userVotingPower > 0 && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVoteMilestone(milestone.id, true)}
                          disabled={isPending || isTxLoading}
                        >
                          Vote For
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVoteMilestone(milestone.id, false)}
                          disabled={isPending || isTxLoading}
                        >
                          Vote Against
                        </Button>
                      </div>
                    )}
                  </div>
                  <Progress
                    value={milestone.totalVotes > 0 ? (milestone.votesFor / milestone.totalVotes) * 100 : 0}
                    className="w-full"
                  />
                </div>
              )}

              {/* Creator Actions */}
              {isCreator && milestone.status === "pending" && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-3">
                    <Label htmlFor={`evidence-${milestone.id}`}>Evidence of Completion</Label>
                    <Textarea
                      id={`evidence-${milestone.id}`}
                      placeholder="Describe how this milestone was completed, provide links to deliverables, etc."
                      value={selectedMilestone === milestone.id ? evidence : ""}
                      onChange={(e) => {
                        setEvidence(e.target.value)
                        setSelectedMilestone(milestone.id)
                      }}
                      rows={3}
                    />
                    <Button
                      onClick={() => handleSubmitMilestone(milestone.id)}
                      disabled={!evidence.trim() || isSubmitting || isPending || isTxLoading}
                      className="w-full"
                    >
                      {(isSubmitting || isPending || isTxLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Upload className="mr-2 h-4 w-4" />
                      Submit for Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voting Power Info */}
      {userVotingPower > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Voting Power</p>
                <p className="text-sm text-muted-foreground">Based on your pledge amount and reputation</p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {userVotingPower} votes
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
