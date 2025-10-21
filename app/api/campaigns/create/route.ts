import { type NextRequest, NextResponse } from "next/server"
import { createCampaign, createCampaignTiers } from "@/lib/actions/campaigns"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  console.log("[v0] Campaign creation API called")
  try {
    console.log("[v0] Parsing form data...")
    const formData = await request.formData()

    // Extract JSON data
    const dataString = formData.get("data") as string
    if (!dataString) {
      console.log("[v0] Error: Missing campaign data")
      return NextResponse.json({ error: "Missing campaign data" }, { status: 400 })
    }

    console.log("[v0] Parsing JSON data...")
    const body = JSON.parse(dataString)
    console.log("[v0] Campaign data parsed:", {
      hasBasic: !!body.basic,
      hasMedia: !!body.media,
      hasFunding: !!body.funding,
      hasRewards: !!body.rewards,
      hasCampaignId: !!body.campaignId,
      hasCreatorAddress: !!body.creatorAddress,
    })

    const { basic, media, funding, rewards, campaignId, creatorAddress } = body

    // Validate required fields
    if (!basic?.title || !basic?.description || !funding?.goal) {
      console.log("[v0] Error: Missing required fields", {
        hasTitle: !!basic?.title,
        hasDescription: !!basic?.description,
        hasGoal: !!funding?.goal,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!creatorAddress) {
      console.log("[v0] Error: Creator address is required")
      return NextResponse.json({ error: "Creator address is required" }, { status: 400 })
    }

    console.log("[v0] Processing cover image...")
    let coverImageUrl = "/placeholder.svg?height=400&width=600"
    const coverImageFile = formData.get("coverImage") as File | null

    if (coverImageFile) {
      try {
        console.log("[v0] Uploading cover image:", coverImageFile.name)
        const blob = await put(`campaigns/${Date.now()}-${coverImageFile.name}`, coverImageFile, {
          access: "public",
        })
        coverImageUrl = blob.url
        console.log("[v0] Cover image uploaded:", blob.url)
      } catch (error) {
        console.error("[v0] Failed to upload cover image:", error)
        // Continue with placeholder if upload fails
      }
    }

    console.log("[v0] Processing gallery images...")
    const galleryUrls: string[] = []
    const galleryFiles = formData.getAll("gallery") as File[]

    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        try {
          console.log("[v0] Uploading gallery image:", file.name)
          const blob = await put(`campaigns/${Date.now()}-${file.name}`, file, {
            access: "public",
          })
          galleryUrls.push(blob.url)
          console.log("[v0] Gallery image uploaded:", blob.url)
        } catch (error) {
          console.error("[v0] Failed to upload gallery image:", error)
          // Continue with other images if one fails
        }
      }
    }

    console.log("[v0] Creating campaign in database...")
    const campaign = await createCampaign({
      title: basic.title,
      description: basic.subtitle || basic.title,
      story: basic.description,
      goal_amount: funding.goal,
      creator_id: creatorAddress,
      category: basic.category || "other",
      tags: basic.tags || [],
      cover_image: coverImageUrl,
      gallery: galleryUrls,
      video_url: media?.youtubeUrl || undefined,
      duration: funding.duration,
      contract_tx_hash: undefined,
      escrow_address: undefined,
    })
    console.log("[v0] Campaign created with ID:", campaign.id)

    if (rewards && Array.isArray(rewards) && rewards.length > 0) {
      console.log("[v0] Saving reward tiers:", rewards.length)
      await createCampaignTiers(
        campaign.id,
        rewards.map((tier: any, index: number) => ({
          title: tier.title,
          description: tier.description,
          amount: tier.amount,
          rewards: tier.rewards || [],
          maxBackers: tier.quantity,
          isLimited: tier.isLimited || false,
          estimatedDelivery: tier.deliveryDate,
          shippingCost: tier.shippingCost,
          startsAt: tier.startsAt,
          endsAt: tier.endsAt,
          sortOrder: index,
        })),
      )
      console.log("[v0] Reward tiers saved successfully")
    }

    console.log("[v0] Campaign creation completed successfully")
    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
      campaignId: campaign.id,
      status: "active",
      coverImage: coverImageUrl,
      gallery: galleryUrls,
      videoUrl: media?.youtubeUrl || null,
    })
  } catch (error) {
    console.error("[v0] Campaign creation error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
