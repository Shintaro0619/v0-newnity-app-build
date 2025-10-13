import { type NextRequest, NextResponse } from "next/server"
import { createCampaign } from "@/lib/actions/campaigns"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract JSON data
    const dataString = formData.get("data") as string
    if (!dataString) {
      return NextResponse.json({ error: "Missing campaign data" }, { status: 400 })
    }

    const body = JSON.parse(dataString)
    const { basic, media, funding, rewards, campaignId, creatorAddress } = body

    // Validate required fields
    if (!basic?.title || !basic?.description || !funding?.goal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!creatorAddress) {
      return NextResponse.json({ error: "Creator address is required" }, { status: 400 })
    }

    let coverImageUrl = "/placeholder.svg?height=400&width=600"
    const coverImageFile = formData.get("coverImage") as File | null

    if (coverImageFile) {
      try {
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

    const galleryUrls: string[] = []
    const galleryFiles = formData.getAll("gallery") as File[]

    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        try {
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
      coverImage: coverImageUrl,
      gallery: galleryUrls,
    })
  } catch (error) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
