"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"

interface KYCStatusBadgeProps {
  status: "pending" | "in-review" | "approved" | "rejected"
  className?: string
}

export function KYCStatusBadge({ status, className }: KYCStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "KYC Required",
      variant: "secondary" as const,
      icon: AlertTriangle,
      className: "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950",
    },
    "in-review": {
      label: "Under Review",
      variant: "secondary" as const,
      icon: Clock,
      className: "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
    },
    approved: {
      label: "Verified",
      variant: "default" as const,
      icon: CheckCircle,
      className: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: XCircle,
      className: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
