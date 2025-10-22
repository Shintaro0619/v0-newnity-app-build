import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/pledges - Create new pledge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { amount, currency = "USDC", backerId, campaignId, tierId, txHash } = body

    // Validate campaign is active and not ended
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        status: true,
        endDate: true,
        minContributionUsdc: true, // Fetch min_contribution_usdc
      },
    })

    if (!campaign || campaign.status !== "ACTIVE") {
      return NextResponse.json({ error: "Campaign is not active" }, { status: 400 })
    }

    if (campaign.endDate && new Date() > campaign.endDate) {
      return NextResponse.json({ error: "Campaign has ended" }, { status: 400 })
    }

    const minContributionUsdc = campaign.minContributionUsdc || 1_000_000 // Default to $1
    const amountUsdc = Math.round(amount * 1_000_000) // Convert USD to USDC atomic units
    if (amountUsdc < minContributionUsdc) {
      return NextResponse.json(
        {
          error: `Below minimum pledge ($${minContributionUsdc / 1_000_000})`,
        },
        { status: 400 },
      )
    }

    let tier = null
    if (tierId) {
      tier = await prisma.tier.findUnique({
        where: { id: tierId },
        select: {
          isLimited: true,
          maxBackers: true,
          minted: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
        },
      })

      if (!tier) {
        return NextResponse.json({ error: "Tier not found" }, { status: 404 })
      }

      // Check if tier is active
      if (tier.isActive === false) {
        return NextResponse.json({ error: "This reward tier is not active" }, { status: 400 })
      }

      // Check time constraints
      const now = new Date()
      if (tier.startsAt && now < new Date(tier.startsAt)) {
        return NextResponse.json({ error: "This reward tier is not available yet" }, { status: 400 })
      }
      if (tier.endsAt && now > new Date(tier.endsAt)) {
        return NextResponse.json({ error: "This reward tier has expired" }, { status: 400 })
      }

      // Check if tier has reached max backers
      if (tier.isLimited && tier.maxBackers !== null) {
        const currentMinted = tier.minted || 0
        if (currentMinted >= tier.maxBackers) {
          return NextResponse.json(
            {
              error: `This reward tier is sold out (${tier.maxBackers} backers limit reached)`,
            },
            { status: 400 },
          )
        }
      }
    }

    // Create pledge and update campaign raised amount
    const pledge = await prisma.$transaction(async (tx) => {
      const newPledge = await tx.pledge.create({
        data: {
          amount,
          currency,
          backerId,
          campaignId,
          tierId,
          txHash,
          status: "PENDING",
        },
        include: {
          backer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
          tier: {
            select: {
              id: true,
              title: true,
              amount: true,
            },
          },
        },
      })

      // Update campaign raised amount
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          raisedAmount: {
            increment: amount,
          },
        },
      })

      if (tierId) {
        await tx.tier.update({
          where: { id: tierId },
          data: {
            minted: {
              increment: 1,
            },
          },
        })
      }

      return newPledge
    })

    return NextResponse.json(pledge, { status: 201 })
  } catch (error) {
    console.error("Error creating pledge:", error)
    return NextResponse.json({ error: "Failed to create pledge" }, { status: 500 })
  }
}

// GET /api/pledges - Get user's pledges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const campaignId = searchParams.get("campaignId")

    if (!userId && !campaignId) {
      return NextResponse.json({ error: "userId or campaignId required" }, { status: 400 })
    }

    const where: any = {}
    if (userId) where.backerId = userId
    if (campaignId) where.campaignId = campaignId

    const pledges = await prisma.pledge.findMany({
      where,
      include: {
        backer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            status: true,
          },
        },
        tier: {
          select: {
            id: true,
            title: true,
            amount: true,
            rewards: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(pledges)
  } catch (error) {
    console.error("Error fetching pledges:", error)
    return NextResponse.json({ error: "Failed to fetch pledges" }, { status: 500 })
  }
}
