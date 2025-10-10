"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Edit3,
  Eye,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  StopCircle,
} from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  title: string
  status: "DRAFT" | "REVIEW" | "ACTIVE" | "SUCCESSFUL" | "FAILED" | "CANCELLED"
  goalAmount: number
  raisedAmount: number
  backers: number
  daysLeft: number
  createdAt: string
}

interface CampaignManagementWidgetProps {
  campaign: Campaign
  onStatusChange?: (campaignId: string, newStatus: Campaign["status"]) => void
  showActions?: boolean
  compact?: boolean
}

export function CampaignManagementWidget({
  campaign,
  onStatusChange,
  showActions = true,
  compact = false,
}: CampaignManagementWidgetProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const progressPercentage = (campaign.raisedAmount / campaign.goalAmount) * 100

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "SUCCESSFUL":
        return "default"
      case "DRAFT":
        return "secondary"
      case "REVIEW":
        return "secondary"
      case "FAILED":
        return "destructive"
      case "CANCELLED":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Play className="h-3 w-3" />
      case "SUCCESSFUL":
        return <CheckCircle className="h-3 w-3" />
      case "DRAFT":
        return <Edit3 className="h-3 w-3" />
      case "REVIEW":
        return <Clock className="h-3 w-3" />
      case "FAILED":
        return <AlertTriangle className="h-3 w-3" />
      case "CANCELLED":
        return <StopCircle className="h-3 w-3" />
      default:
        return <Pause className="h-3 w-3" />
    }
  }

  const handleStatusChange = async (newStatus: Campaign["status"]) => {
    if (!onStatusChange) return

    setIsUpdating(true)
    try {
      await onStatusChange(campaign.id, newStatus)
    } catch (error) {
      console.error("Failed to update campaign status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium truncate mr-2">{campaign.title}</h3>
            <Badge variant={getStatusColor(campaign.status)} className="flex items-center gap-1">
              {getStatusIcon(campaign.status)}
              {campaign.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>${campaign.raisedAmount.toLocaleString()}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1" />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{campaign.backers} backers</span>
              <span>{campaign.daysLeft} days left</span>
            </div>
          </div>

          {showActions && (
            <div className="flex space-x-1 mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/campaigns/${campaign.id}/edit`}>
                  <Edit3 className="h-3 w-3" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/campaigns/${campaign.id}`}>
                  <Eye className="h-3 w-3" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/analytics">
                  <BarChart3 className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.title}</CardTitle>
            <CardDescription>Created {new Date(campaign.createdAt).toLocaleDateString()}</CardDescription>
          </div>
          <Badge variant={getStatusColor(campaign.status)} className="flex items-center gap-1">
            {getStatusIcon(campaign.status)}
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-primary">${campaign.raisedAmount.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">of ${campaign.goalAmount.toLocaleString()}</span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">{Math.round(progressPercentage)}%</div>
              <div className="text-xs text-muted-foreground">Funded</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{campaign.backers}</div>
              <div className="text-xs text-muted-foreground">Backers</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{campaign.daysLeft}</div>
              <div className="text-xs text-muted-foreground">Days Left</div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        {onStatusChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Status</label>
            <Select value={campaign.status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">Under Review</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Alerts */}
        {campaign.status === "DRAFT" && (
          <Alert>
            <Edit3 className="h-4 w-4" />
            <AlertDescription>Campaign is in draft mode. Complete setup and submit for review.</AlertDescription>
          </Alert>
        )}

        {campaign.status === "REVIEW" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>Campaign is under review. You'll be notified once approved.</AlertDescription>
          </Alert>
        )}

        {campaign.daysLeft <= 7 && campaign.status === "ACTIVE" && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Campaign ending soon! Only {campaign.daysLeft} days remaining.</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/campaigns/${campaign.id}/edit`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/campaigns/${campaign.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/campaigns/${campaign.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
