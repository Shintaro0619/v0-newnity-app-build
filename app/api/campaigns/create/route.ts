import { type NextRequest, NextResponse } from "next/server"
import { createCampaign } from "@/lib/actions/campaigns"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { basic, media, funding, rewards, campaignId, creatorAddress } = body

    // Validate required fields
    if (!basic?.title || !basic?.description || !funding?.goal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!creatorAddress) {
      return NextResponse.json({ error: "Creator address is required" }, { status: 400 })
    }

    const coverImageUrl = "/placeholder.svg?height=400&width=600"
    const galleryUrls: string[] = []

    // In production, handle actual file uploads here
    // For now, use placeholder images

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
      video_url: undefined,
      duration: funding.duration,
      contract_tx_hash: undefined,
      escrow_address: undefined,
    })

    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
      campaignId: campaign.id,
      status: "active",
    })
  } catch (error) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
