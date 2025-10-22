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

    const minContributionUsdc =
      funding.minPledge && funding.minPledge > 0 ? Math.floor(funding.minPledge * 1000000) : 1000000

    console.log("[v0] Min contribution calculation:", {
      minPledge: funding.minPledge,
      minContributionUsdc,
    })

    console.log("[v0] Starting parallel image uploads...")
    const uploadStartTime = Date.now()

    const coverImageFile = formData.get("coverImage") as File | null
    const galleryFiles = formData.getAll("gallery") as File[]

    // Upload cover image and gallery images in parallel
    const uploadPromises: Promise<string>[] = []

    if (coverImageFile) {
      console.log("[v0] Uploading cover image:", coverImageFile.name)
      uploadPromises.push(
        put(`campaigns/${Date.now()}-${coverImageFile.name}`, coverImageFile, {
          access: "public",
        }).then((blob) => {
          console.log("[v0] Cover image uploaded:", blob.url)
          return blob.url
        }),
      )
    } else {
      uploadPromises.push(Promise.resolve("/placeholder.svg?height=400&width=600"))
    }

    // Upload gallery images in parallel
    const galleryPromises = galleryFiles
      .filter((file) => file && file.size > 0)
      .map((file, index) => {
        console.log(`[v0] Uploading gallery image ${index + 1}:`, file.name)
        return put(`campaigns/${Date.now()}-${index}-${file.name}`, file, {
          access: "public",
        })
          .then((blob) => {
            console.log(`[v0] Gallery image ${index + 1} uploaded:`, blob.url)
            return blob.url
          })
          .catch((error) => {
            console.error(`[v0] Failed to upload gallery image ${index + 1}:`, error)
            return null
          })
      })

    // Wait for all uploads to complete
    const [coverImageUrl, ...galleryResults] = await Promise.all([...uploadPromises, ...galleryPromises])
    const galleryUrls = galleryResults.filter((url): url is string => url !== null)

    const uploadEndTime = Date.now()
    console.log(`[v0] All uploads completed in ${uploadEndTime - uploadStartTime}ms`)
    console.log("[v0] Cover image URL:", coverImageUrl)
    console.log("[v0] Gallery URLs:", galleryUrls)

    console.log("[v0] Creating campaign in database...")
    const dbStartTime = Date.now()

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
      min_contribution_usdc: minContributionUsdc,
    })

    const dbEndTime = Date.now()
    console.log(`[v0] Campaign created with ID: ${campaign.id} in ${dbEndTime - dbStartTime}ms`)

    if (rewards && Array.isArray(rewards) && rewards.length > 0) {
      console.log("[v0] Saving reward tiers:", rewards.length)
      const tiersStartTime = Date.now()

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

      const tiersEndTime = Date.now()
      console.log(`[v0] Reward tiers saved successfully in ${tiersEndTime - tiersStartTime}ms`)
    }

    const totalTime = Date.now() - uploadStartTime
    console.log(`[v0] Campaign creation completed successfully in ${totalTime}ms`)

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

    let errorMessage = "Internal server error"
    if (error instanceof Error) {
      errorMessage = error.message
      // Check for specific error types
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Upload timeout. Please try with smaller images or fewer gallery images."
      } else if (error.message.includes("blob") || error.message.includes("storage")) {
        errorMessage = "Image upload failed. Please check your images and try again."
      } else if (error.message.includes("database") || error.message.includes("SQL")) {
        errorMessage = "Database error. Please try again."
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
