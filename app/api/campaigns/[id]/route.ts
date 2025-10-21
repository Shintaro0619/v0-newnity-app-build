import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, getCampaignTiers } from "@/lib/actions/campaigns"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import sanitizeHtml from "sanitize-html"

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

    if (body.min_contribution_usdc !== undefined) {
      console.log("[v0] Updating min_contribution_usdc:", body.min_contribution_usdc)

      await sql`
        UPDATE campaigns
        SET
          min_contribution_usdc = ${body.min_contribution_usdc},
          updated_at = NOW()
        WHERE id = ${params.id}
      `
      console.log("[v0] min_contribution_usdc updated successfully")
    }

    if (
      body.title ||
      body.description ||
      body.category ||
      body.tags ||
      body.goal_amount ||
      body.end_date ||
      body.duration ||
      body.video_url !== undefined
    ) {
      console.log("[v0] Updating basic campaign fields")

      if (body.title) {
        await sql`UPDATE campaigns SET title = ${body.title}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.description) {
        await sql`UPDATE campaigns SET description = ${body.description}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.category) {
        await sql`UPDATE campaigns SET category = ${body.category}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.tags) {
        await sql`UPDATE campaigns SET tags = ${body.tags}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.goal_amount !== undefined) {
        await sql`UPDATE campaigns SET goal_amount = ${body.goal_amount}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.end_date) {
        await sql`UPDATE campaigns SET end_date = ${body.end_date}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.duration !== undefined) {
        await sql`UPDATE campaigns SET duration = ${body.duration}, updated_at = NOW() WHERE id = ${params.id}`
      }
      if (body.video_url !== undefined) {
        await sql`UPDATE campaigns SET video_url = ${body.video_url}, updated_at = NOW() WHERE id = ${params.id}`
      }

      console.log("[v0] Basic campaign fields updated successfully")
    }

    if (body.cover_image !== undefined) {
      console.log("[v0] Updating cover_image:", body.cover_image)
      await sql`UPDATE campaigns SET cover_image = ${body.cover_image}, updated_at = NOW() WHERE id = ${params.id}`
      console.log("[v0] cover_image updated successfully")
    }

    if (body.gallery !== undefined) {
      console.log("[v0] Updating gallery:", body.gallery)
      await sql`UPDATE campaigns SET gallery = ${body.gallery}, updated_at = NOW() WHERE id = ${params.id}`
      console.log("[v0] gallery updated successfully")
    }

    // if (body.social_links !== undefined) {
    //   console.log("[v0] Social links received:", body.social_links)
    //   const normalizedLinks = normalizeSocialLinks(body.social_links)
    //   console.log("[v0] Normalized social links:", normalizedLinks)
    //   await sql`
    //     UPDATE campaigns
    //     SET
    //       social_links = ${JSON.stringify(normalizedLinks)},
    //       updated_at = NOW()
    //     WHERE id = ${params.id}
    //   `
    //   console.log("[v0] Campaign social links updated successfully")
    // }

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
          quantity: tier.quantity,
        })

        await sql`
          UPDATE tiers
          SET
            title = ${tier.title},
            description = ${tier.description || ""},
            amount = ${Number(tier.amount)},
            is_limited = ${tier.isLimited || false},
            max_backers = ${tier.isLimited && tier.quantity ? Number(tier.quantity) : null},
            rewards = ${tier.items || []},
            estimated_delivery = ${tier.deliveryDate || null},
            updated_at = NOW()
          WHERE id = ${tier.id}
            AND campaign_id = ${params.id}
        `
      }

      console.log("[v0] Tiers updated successfully")
    }

    const campaign = await getCampaignById(params.id)

    try {
      revalidatePath(`/campaigns/${params.id}`)
      console.log("[v0] Revalidated campaign detail page cache")
    } catch (error) {
      console.error("[v0] Failed to revalidate cache:", error)
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("[v0] Error updating campaign:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update campaign" },
      { status: 500 },
    )
  }
}
