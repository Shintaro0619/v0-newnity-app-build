"use client"

import { useState } from "react"
import type { RewardTier } from "./types" // Import RewardTier type

interface EditCampaignClientProps {
  campaign: any
  tiers: any[] // Add tiers prop
}

export function EditCampaignClient({ campaign, tiers }: EditCampaignClientProps) {
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>(
    tiers.map((tier) => ({
      id: tier.id,
      title: tier.title,
      description: tier.description,
      amount: Number(tier.amount),
      deliveryDate: tier.estimated_delivery ? new Date(tier.estimated_delivery) : undefined,
      quantity: tier.max_backers,
      isLimited: tier.is_limited,
      items: tier.rewards || [],
    })),
  )
}
