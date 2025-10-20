import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, getCampaignTiers, updateCampaignBlockchainData } from "@/lib/actions/campaigns"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import sanitizeHtml from "sanitize-html"
import { normalizeSocialLinks } from "@/lib/utils/normalize-social"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await getCampaignById(params.id)

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const tiers = await getCampaignTiers(params.id)

    return NextResponse.json({
      ...campaign,
      tiers,
    })
  } catch (error) {
    console.error("[v0] Error fetching campaign:", error)
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log("[v0] PUT /api/campaigns/[id] - Received body:", JSON.stringify(body, null, 2))

    if (body.social_links !== undefined) {
      console.log("[v0] Social links received:", body.social_links)

      // Normalize social links
      const normalizedLinks = normalizeSocialLinks(body.social_links)
      console.log("[v0] Normalized social links:", normalizedLinks)

      await sql`
        UPDATE campaigns
        SET
          social_links = ${JSON.stringify(normalizedLinks)},
          updated_at = NOW()
        WHERE id = ${params.id}
      `
      console.log("[v0] Campaign social links updated successfully")
    }

    if (body.story !== undefined) {
      console.log("[v0] Updating campaign story")

      const cleanStory = sanitizeHtml(body.story, {
        allowedTags: [
          "h1",
          "h2",
          "h3",
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "blockquote",
          "ul",
          "ol",
          "li",
          "a",
          "img",
          "code",
          "pre",
          "hr",
          "mark",
        ],
        allowedAttributes: {
          a: ["href", "target", "rel"],
          img: ["src", "alt", "width", "height"],
          h1: ["style"],
          h2: ["style"],
          h3: ["style"],
          p: ["style"],
          li: ["style"],
          blockquote: ["style"],
          mark: ["data-color"],
        },
        allowedStyles: {
          "*": {
            "text-align": [/^(left|right|center|justify)$/],
          },
        },
        transformTags: {
          a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener nofollow" }),
        },
      })

      await sql`
        UPDATE campaigns
        SET
          story = ${cleanStory},
          updated_at = NOW()
        WHERE id = ${params.id}
      `
      console.log("[v0] Campaign story updated and sanitized")
    }

    if (body.tiers && Array.isArray(body.tiers)) {
      console.log("[v0] Updating tiers:", body.tiers.length)

      for (const tier of body.tiers) {
        console.log("[v0] Updating tier:", {
          id: tier.id,
          title: tier.title,
          isLimited: tier.isLimited,
          maxBackers: tier.maxBackers,
        })

        await sql`
          UPDATE tiers
          SET
            title = ${tier.title},
            description = ${tier.description || ""},
            amount = ${Number(tier.amount)},
            is_limited = ${tier.isLimited || false},
            max_backers = ${tier.isLimited && tier.maxBackers ? Number(tier.maxBackers) : null},
            rewards = ${tier.rewards || []},
            estimated_delivery = ${tier.estimatedDelivery || null},
            shipping_cost = ${tier.shippingCost || null},
            updated_at = NOW()
          WHERE id = ${tier.id}
            AND campaign_id = ${params.id}
        `
      }

      console.log("[v0] Tiers updated successfully")
    }

    const { tiers, story, social_links, ...campaignData } = body
    const campaign = await updateCampaignBlockchainData(params.id, campaignData)

    try {
      revalidatePath(`/campaigns/${params.id}`)
      console.log("[v0] Revalidated campaign detail page cache")
    } catch (error) {
      console.error("[v0] Failed to revalidate cache:", error)
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("[v0] Error updating campaign:", error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}
