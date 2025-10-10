"use server"

import { createCampaign } from "@/lib/actions/campaigns"
import { revalidatePath } from "next/cache"

export async function createCampaignAction(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const story = formData.get("story") as string
    const goal_amount = Number.parseFloat(formData.get("goal_amount") as string)
    const creator_id = formData.get("creator_id") as string
    const category = formData.get("category") as string
    const tags = JSON.parse(formData.get("tags") as string)
    const cover_image = formData.get("cover_image") as string
    const gallery = JSON.parse(formData.get("gallery") as string)
    const video_url = formData.get("video_url") as string
    const duration = Number.parseInt(formData.get("duration") as string)
    const contract_tx_hash = formData.get("contract_tx_hash") as string
    const escrow_address = formData.get("escrow_address") as string

    const campaign = await createCampaign({
      title,
      description,
      story,
      goal_amount,
      creator_id,
      category,
      tags,
      cover_image,
      gallery,
      video_url,
      duration,
      contract_tx_hash,
      escrow_address,
    })

    revalidatePath("/campaigns")
    revalidatePath("/")

    return { success: true, campaign }
  } catch (error) {
    console.error("[v0] Error in createCampaignAction:", error)
    return { success: false, error: "Failed to create campaign" }
  }
}
