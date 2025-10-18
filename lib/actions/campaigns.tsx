"use server"

import { sql } from "@/lib/db"
import { calculateDeadline } from "@/lib/utils/date-utils"

export interface Campaign {
  id: string
  title: string
  description: string
  story: string
  goal_amount: number
  raised_amount: number
  creator_id: string
  category: string
  tags: string[]
  cover_image: string
  gallery: string[]
  video_url: string | null
  status: string
  start_date: Date
  end_date: Date
  duration: number
  currency: string
  platform_fee: number
  contract_tx_hash: string | null
  escrow_address: string | null
  created_at: Date
  updated_at: Date
  blockchain_campaign_id?: number
  deadline_input_type?: string
}

export async function ensureUserExists(walletAddress: string) {
  try {
    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE wallet_address = ${walletAddress}
    `

    if (existingUser.length > 0) {
      return existingUser[0].id
    }

    // Create user if doesn't exist
    const newUser = await sql`
      INSERT INTO users (
        id,
        email,
        name,
        wallet_address,
        kyc_status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${walletAddress.toLowerCase() + "@wallet.local"},
        ${"User " + walletAddress.slice(0, 6)},
        ${walletAddress},
        'PENDING',
        NOW(),
        NOW()
      )
      RETURNING id
    `

    return newUser[0].id
  } catch (error) {
    console.error("[v0] Error ensuring user exists:", error)
    throw error
  }
}

export async function getCampaigns(filters?: {
  category?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: string
}) {
  try {
    console.log("[v0] getCampaigns called with filters:", filters)

    const limit = filters?.limit || 12
    const offset = filters?.offset || 0
    const searchPattern = filters?.search ? `%${filters.search}%` : null

    if (searchPattern) {
      console.log("[v0] Search pattern:", searchPattern)

      // Query to see what campaigns exist
      const allCampaigns = await sql`
        SELECT id, title, description, category, status
        FROM campaigns
        LIMIT 5
      `
      console.log("[v0] Sample campaigns in database:", JSON.stringify(allCampaigns, null, 2))
    }

    let campaigns

    // Build query based on filter combinations
    if (filters?.category && filters.category !== "all" && filters?.status && searchPattern) {
      // Category + Status + Search
      const statusCondition = filters.status === "ACTIVE" ? sql`c.status = 'ACTIVE'` : sql`c.status = ${filters.status}`

      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE c.category = ${filters.category}
          AND ${statusCondition}
          AND (c.title ILIKE ${searchPattern} OR c.description ILIKE ${searchPattern} OR c.category ILIKE ${searchPattern})
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (filters?.category && filters.category !== "all" && filters?.status) {
      // Category + Status
      const statusCondition = filters.status === "ACTIVE" ? sql`c.status = 'ACTIVE'` : sql`c.status = ${filters.status}`

      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE c.category = ${filters.category}
          AND ${statusCondition}
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (filters?.category && filters.category !== "all" && searchPattern) {
      // Category + Search
      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE c.category = ${filters.category}
          AND (c.title ILIKE ${searchPattern} OR c.description ILIKE ${searchPattern} OR c.category ILIKE ${searchPattern})
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (filters?.status && searchPattern) {
      // Status + Search
      const statusCondition = filters.status === "ACTIVE" ? sql`c.status = 'ACTIVE'` : sql`c.status = ${filters.status}`

      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE ${statusCondition}
          AND (c.title ILIKE ${searchPattern} OR c.description ILIKE ${searchPattern} OR c.category ILIKE ${searchPattern})
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (filters?.category && filters.category !== "all") {
      // Category only
      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE c.category = ${filters.category}
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (filters?.status) {
      // Status only
      const statusCondition = filters.status === "ACTIVE" ? sql`c.status = 'ACTIVE'` : sql`c.status = ${filters.status}`

      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE ${statusCondition}
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (searchPattern) {
      // Search only
      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        WHERE c.title ILIKE ${searchPattern} OR c.description ILIKE ${searchPattern} OR c.category ILIKE ${searchPattern}
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      // No filters
      campaigns = await sql`
        SELECT 
          c.*,
          u.name as creator_name,
          u.avatar as creator_avatar,
          COUNT(DISTINCT p.id) as backers_count
        FROM campaigns c
        LEFT JOIN users u ON c.creator_id = u.id
        LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
        GROUP BY c.id, u.name, u.avatar 
        ORDER BY c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }

    console.log("[v0] Found campaigns:", campaigns.length)

    return campaigns.map((campaign) => ({
      ...campaign,
      blockchainCampaignId: campaign.blockchain_campaign_id,
    }))
  } catch (error) {
    console.error("[v0] Error fetching campaigns:", error)
    return []
  }
}

export async function getCampaignById(id: string) {
  try {
    console.log("[v0] getCampaignById called with ID:", id)

    const result = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        u.bio as creator_bio,
        u.wallet_address as creator_wallet,
        COUNT(DISTINCT p.backer_id) as backers_count,
        COALESCE(SUM(p.amount), 0) as total_pledged
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
      WHERE c.id = ${id}
      GROUP BY c.id, u.name, u.avatar, u.bio, u.wallet_address
    `

    console.log("[v0] Query result:", result.length > 0 ? "Found" : "Not found")

    if (!result[0]) return null

    const campaign = result[0]
    return {
      ...campaign,
      blockchainCampaignId: campaign.blockchain_campaign_id,
      creator: {
        name: campaign.creator_name,
        avatar: campaign.creator_avatar,
        bio: campaign.creator_bio,
        walletAddress: campaign.creator_wallet,
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching campaign:", error)
    throw error
  }
}

export async function createCampaign(data: {
  title: string
  description: string
  story: string
  goal_amount: number
  creator_id: string
  category: string
  tags: string[]
  cover_image: string
  gallery: string[]
  video_url?: string
  duration: number
  contract_tx_hash?: string
  escrow_address?: string
}) {
  try {
    const userId = await ensureUserExists(data.creator_id)

    const startDate = new Date()
    const deadlineTimestamp = calculateDeadline(startDate, data.duration)
    const endDate = new Date(deadlineTimestamp * 1000)

    const result = await sql`
      INSERT INTO campaigns (
        id,
        title,
        description,
        story,
        goal_amount,
        raised_amount,
        creator_id,
        category,
        tags,
        cover_image,
        gallery,
        video_url,
        status,
        start_date,
        end_date,
        duration,
        currency,
        platform_fee,
        contract_tx_hash,
        escrow_address,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${data.title},
        ${data.description},
        ${data.story},
        ${data.goal_amount},
        0,
        ${userId},
        ${data.category},
        ${data.tags},
        ${data.cover_image},
        ${data.gallery},
        ${data.video_url || null},
        'DRAFT',
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        ${data.duration},
        'USDC',
        5,
        ${data.contract_tx_hash || null},
        ${data.escrow_address || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    console.log("[v0] Campaign created with deadline:", {
      duration: data.duration,
      endDate: endDate.toISOString(),
      deadlineTimestamp,
    })

    return result[0]
  } catch (error) {
    console.error("[v0] Error creating campaign:", error)
    throw error
  }
}

export async function updateCampaignBlockchainData(
  campaignId: string,
  data: {
    blockchain_campaign_id?: number
    contract_tx_hash?: string
    escrow_address?: string
    raised_amount?: number
    status?: string
  },
) {
  try {
    console.log("[v0] [SERVER ACTION] updateCampaignBlockchainData called with:", {
      campaignId,
      data,
    })

    let result

    if (data.status) {
      console.log("[v0] [SERVER ACTION] Updating status to:", data.status)

      if (data.blockchain_campaign_id !== undefined && data.raised_amount !== undefined) {
        // Update status, blockchain_campaign_id, and raised_amount
        result = await sql`
          UPDATE campaigns 
          SET 
            status = ${data.status},
            blockchain_campaign_id = ${data.blockchain_campaign_id},
            raised_amount = ${data.raised_amount},
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, updated_at
        `
      } else if (data.blockchain_campaign_id !== undefined) {
        // Update status and blockchain_campaign_id
        result = await sql`
          UPDATE campaigns 
          SET 
            status = ${data.status},
            blockchain_campaign_id = ${data.blockchain_campaign_id},
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, updated_at
        `
      } else if (data.raised_amount !== undefined) {
        // Update status and raised_amount
        result = await sql`
          UPDATE campaigns 
          SET 
            status = ${data.status},
            raised_amount = ${data.raised_amount},
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, updated_at
        `
      } else {
        // Update status only
        result = await sql`
          UPDATE campaigns 
          SET 
            status = ${data.status},
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, updated_at
        `
      }

      if (data.status === "ACTIVE") {
        console.log("[v0] [SERVER ACTION] Updating start_date to current time")
        await sql`
          UPDATE campaigns 
          SET start_date = NOW()
          WHERE id = ${campaignId}
        `
      }
    } else if (data.blockchain_campaign_id !== undefined || data.contract_tx_hash) {
      console.log("[v0] [SERVER ACTION] Blockchain deployment detected, setting status to ACTIVE")

      if (data.blockchain_campaign_id !== undefined && data.contract_tx_hash && data.escrow_address) {
        result = await sql`
          UPDATE campaigns 
          SET 
            blockchain_campaign_id = ${data.blockchain_campaign_id},
            contract_tx_hash = ${data.contract_tx_hash},
            escrow_address = ${data.escrow_address},
            status = 'ACTIVE',
            start_date = NOW(),
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, start_date, updated_at
        `
      } else if (data.blockchain_campaign_id !== undefined) {
        result = await sql`
          UPDATE campaigns 
          SET 
            blockchain_campaign_id = ${data.blockchain_campaign_id},
            status = 'ACTIVE',
            start_date = NOW(),
            updated_at = NOW()
          WHERE id = ${campaignId}
          RETURNING id, status, raised_amount, blockchain_campaign_id, start_date, updated_at
        `
      }
    } else if (data.raised_amount !== undefined) {
      result = await sql`
        UPDATE campaigns 
        SET 
          raised_amount = ${data.raised_amount},
          updated_at = NOW()
        WHERE id = ${campaignId}
        RETURNING id, status, raised_amount, blockchain_campaign_id, updated_at
      `
    } else {
      console.log("[v0] [SERVER ACTION] No updates to perform")
      return null
    }

    if (!result || result.length === 0) {
      console.error("[v0] [SERVER ACTION] No campaign found with ID:", campaignId)
      return null
    }

    console.log("[v0] [SERVER ACTION] Campaign updated successfully:", {
      id: result[0]?.id,
      status: result[0]?.status,
      raised_amount: result[0]?.raised_amount,
      blockchain_campaign_id: result[0]?.blockchain_campaign_id,
      updated_at: result[0]?.updated_at,
    })

    return result[0]
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error updating campaign blockchain data:", error)
    console.error("[v0] [SERVER ACTION] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      campaignId,
      data,
    })
    throw error
  }
}

export async function getCampaignsByCreator(creatorWalletAddress: string) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE wallet_address = ${creatorWalletAddress}
    `

    if (userResult.length === 0) {
      return []
    }

    const userId = userResult[0].id

    const campaigns = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        COUNT(DISTINCT p.id) as backers_count
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
      WHERE c.creator_id = ${userId}
      GROUP BY c.id, u.name, u.avatar 
      ORDER BY c.created_at DESC
    `

    return campaigns.map((campaign) => ({
      ...campaign,
      blockchainCampaignId: campaign.blockchain_campaign_id,
    }))
  } catch (error) {
    console.error("[v0] Error fetching creator campaigns:", error)
    return []
  }
}

export async function getCampaignsByBacker(backerWalletAddress: string) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE wallet_address = ${backerWalletAddress}
    `

    if (userResult.length === 0) {
      return []
    }

    const userId = userResult[0].id

    const campaigns = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        COUNT(DISTINCT p2.id) as backers_count,
        SUM(CASE WHEN p.backer_id = ${userId} THEN p.amount ELSE 0 END) as my_pledge_amount,
        MAX(p.created_at) as last_pledge_date
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN pledges p ON c.id = p.campaign_id AND p.backer_id = ${userId} AND p.status = 'CONFIRMED'
      LEFT JOIN pledges p2 ON c.id = p2.campaign_id AND p2.status = 'CONFIRMED'
      WHERE p.id IS NOT NULL
      GROUP BY c.id, u.name, u.avatar 
      ORDER BY last_pledge_date DESC
    `

    return campaigns.map((campaign) => ({
      ...campaign,
      blockchainCampaignId: campaign.blockchain_campaign_id,
      myPledgeAmount: campaign.my_pledge_amount,
    }))
  } catch (error) {
    console.error("[v0] Error fetching backed campaigns:", error)
    return []
  }
}

export async function getUserPledgeStats(walletAddress: string) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE wallet_address = ${walletAddress}
    `

    if (userResult.length === 0) {
      return { totalPledged: 0, totalBacked: 0 }
    }

    const userId = userResult[0].id

    const stats = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_pledged,
        COUNT(DISTINCT campaign_id) as total_backed
      FROM pledges
      WHERE backer_id = ${userId} AND status = 'CONFIRMED'
    `

    return {
      totalPledged: Number(stats[0]?.total_pledged || 0),
      totalBacked: Number(stats[0]?.total_backed || 0),
    }
  } catch (error) {
    console.error("[v0] Error fetching user pledge stats:", error)
    return { totalPledged: 0, totalBacked: 0 }
  }
}

export async function savePledgeToDatabase(data: {
  campaignId: string
  backerWalletAddress: string
  amount: number
  txHash: string
  blockNumber: number
  tierId?: string
}) {
  try {
    console.log("[v0] Saving pledge to database:", data)

    const backerId = await ensureUserExists(data.backerWalletAddress)

    // Create pledge record
    await sql`
      INSERT INTO pledges (
        id,
        campaign_id,
        backer_id,
        amount,
        currency,
        status,
        tx_hash,
        block_number,
        tier_id,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${data.campaignId},
        ${backerId},
        ${data.amount},
        'USDC',
        'CONFIRMED',
        ${data.txHash},
        ${data.blockNumber.toString()},
        ${data.tierId || null},
        NOW(),
        NOW()
      )
    `

    // Update campaign raised_amount
    await sql`
      UPDATE campaigns
      SET 
        raised_amount = raised_amount + ${data.amount},
        updated_at = NOW()
      WHERE id = ${data.campaignId}
    `

    console.log("[v0] Pledge saved to database successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving pledge to database:", error)
    return { success: false, error: String(error) }
  }
}

export async function finalizeCampaignInDatabase(data: {
  campaignId: string
  successful: boolean
  txHash: string
  totalAmount: number
}) {
  try {
    console.log("[v0] [SERVER ACTION] finalizeCampaignInDatabase called with:", {
      campaignId: data.campaignId,
      successful: data.successful,
      txHash: data.txHash,
      totalAmount: data.totalAmount,
    })

    const status = data.successful ? "SUCCESSFUL" : "FAILED"
    console.log("[v0] [SERVER ACTION] Setting campaign status to:", status)

    const result = await sql`
      UPDATE campaigns
      SET 
        status = ${status},
        raised_amount = ${data.totalAmount},
        updated_at = NOW()
      WHERE id = ${data.campaignId}
      RETURNING *
    `

    console.log("[v0] [SERVER ACTION] Campaign finalized in database successfully:", {
      campaignId: result[0]?.id,
      status: result[0]?.status,
      raised_amount: result[0]?.raised_amount,
    })

    return { success: true, campaign: result[0] }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error finalizing campaign in database:", error)
    return { success: false, error: String(error) }
  }
}

export async function saveRefundToDatabase(data: {
  campaignId: string
  backerWalletAddress: string
  amount: number
  txHash: string
}) {
  try {
    console.log("[v0] [SERVER ACTION] saveRefundToDatabase called with:", {
      campaignId: data.campaignId,
      backerWalletAddress: data.backerWalletAddress,
      amount: data.amount,
      txHash: data.txHash,
    })

    const backerId = await ensureUserExists(data.backerWalletAddress)
    console.log("[v0] [SERVER ACTION] Backer ID:", backerId)

    // Update pledge status to REFUNDED
    const pledgeResult = await sql`
      UPDATE pledges
      SET 
        status = 'REFUNDED',
        updated_at = NOW()
      WHERE campaign_id = ${data.campaignId}
        AND backer_id = ${backerId}
        AND status = 'CONFIRMED'
      RETURNING *
    `

    console.log("[v0] [SERVER ACTION] Updated pledges:", {
      count: pledgeResult.length,
      pledgeIds: pledgeResult.map((p) => p.id),
    })

    const campaignResult = await sql`
      UPDATE campaigns
      SET 
        status = 'FAILED',
        updated_at = NOW()
      WHERE id = ${data.campaignId}
        AND status != 'SUCCESSFUL'
      RETURNING *
    `

    console.log("[v0] [SERVER ACTION] Updated campaign:", {
      campaignId: campaignResult[0]?.id,
      status: campaignResult[0]?.status,
    })

    console.log("[v0] [SERVER ACTION] Refund saved to database successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error saving refund to database:", error)
    return { success: false, error: String(error) }
  }
}

export async function saveFundsReleaseToDatabase(data: {
  campaignId: string
  creatorAddress: string
  totalAmount: number
  platformFee: number
  creatorAmount: number
  txHash: string
}) {
  try {
    console.log("[v0] [SERVER ACTION] saveFundsReleaseToDatabase called with:", {
      campaignId: data.campaignId,
      creatorAddress: data.creatorAddress,
      totalAmount: data.totalAmount,
      platformFee: data.platformFee,
      creatorAmount: data.creatorAmount,
      txHash: data.txHash,
    })

    // Update campaign with withdrawal information
    const result = await sql`
      UPDATE campaigns
      SET 
        status = 'SUCCESSFUL',
        raised_amount = ${data.totalAmount},
        updated_at = NOW()
      WHERE id = ${data.campaignId}
      RETURNING *
    `

    console.log("[v0] [SERVER ACTION] Funds release saved to database successfully:", {
      campaignId: result[0]?.id,
      status: result[0]?.status,
      raised_amount: result[0]?.raised_amount,
    })

    return { success: true, campaign: result[0] }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error saving funds release to database:", error)
    return { success: false, error: String(error) }
  }
}

export async function getCampaignTiers(campaignId: string) {
  try {
    console.log("[v0] getCampaignTiers called with campaignId:", campaignId)

    const tiers = await sql`
      SELECT 
        id,
        title,
        description,
        amount,
        rewards,
        is_limited,
        COALESCE(is_active, true) as is_active,
        estimated_delivery,
        shipping_cost,
        starts_at,
        ends_at,
        COALESCE(sort_order, 0) as sort_order,
        created_at
      FROM tiers
      WHERE campaign_id = ${campaignId}
      ORDER BY COALESCE(sort_order, 0) ASC, amount ASC
    `.catch(async (error) => {
      // If the new columns don't exist, fall back to basic query
      if (error.message?.includes("does not exist")) {
        console.log("[v0] Falling back to basic tier query (new columns not found)")
        return await sql`
          SELECT 
            id,
            title,
            description,
            amount,
            rewards,
            is_limited,
            true as is_active,
            estimated_delivery,
            shipping_cost,
            NULL as starts_at,
            NULL as ends_at,
            0 as sort_order,
            created_at
          FROM tiers
          WHERE campaign_id = ${campaignId}
          ORDER BY amount ASC
        `
      }
      throw error
    })

    console.log("[v0] Found tiers:", tiers.length)

    return tiers
  } catch (error) {
    console.error("[v0] Error fetching campaign tiers:", error)
    return []
  }
}

export async function createCampaignTiers(
  campaignId: string,
  tiers: Array<{
    title: string
    description: string
    amount: number
    rewards: string[]
    maxBackers?: number
    isLimited: boolean
    estimatedDelivery?: string
    shippingCost?: number
    startsAt?: string
    endsAt?: string
    sortOrder?: number
  }>,
) {
  try {
    console.log("[v0] Creating campaign tiers:", { campaignId, tierCount: tiers.length })

    for (const [index, tier] of tiers.entries()) {
      await sql`
        INSERT INTO tiers (
          id,
          campaign_id,
          title,
          description,
          amount,
          rewards,
          max_backers,
          minted,
          is_limited,
          is_active,
          estimated_delivery,
          shipping_cost,
          starts_at,
          ends_at,
          sort_order,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${campaignId},
          ${tier.title},
          ${tier.description},
          ${tier.amount},
          ${tier.rewards},
          ${tier.maxBackers || null},
          0,
          ${tier.isLimited},
          true,
          ${tier.estimatedDelivery || null},
          ${tier.shippingCost || null},
          ${tier.startsAt || null},
          ${tier.endsAt || null},
          ${tier.sortOrder !== undefined ? tier.sortOrder : index},
          NOW(),
          NOW()
        )
      `
    }

    console.log("[v0] Campaign tiers created successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error creating campaign tiers:", error)
    throw error
  }
}

export async function deleteDummyCampaigns() {
  try {
    console.log("[v0] [SERVER ACTION] Deleting dummy campaigns (blockchain_id IS NULL)...")

    const tiersResult = await sql`
      DELETE FROM tiers
      WHERE campaign_id IN (
        SELECT id FROM campaigns WHERE blockchain_campaign_id IS NULL
      )
    `
    console.log("[v0] [SERVER ACTION] Deleted tiers:", tiersResult.count)

    const pledgesResult = await sql`
      DELETE FROM pledges
      WHERE campaign_id IN (
        SELECT id FROM campaigns WHERE blockchain_campaign_id IS NULL
      )
    `
    console.log("[v0] [SERVER ACTION] Deleted pledges:", pledgesResult.count)

    const campaignsResult = await sql`
      DELETE FROM campaigns
      WHERE blockchain_campaign_id IS NULL
      RETURNING id, title
    `
    console.log("[v0] [SERVER ACTION] Deleted campaigns:", campaignsResult.length)
    console.log(
      "[v0] [SERVER ACTION] Deleted campaign titles:",
      campaignsResult.map((c) => c.title),
    )

    return {
      success: true,
      deletedCount: campaignsResult.length,
      deletedCampaigns: campaignsResult,
    }
  } catch (error) {
    console.error("[v0] [SERVER ACTION] Error deleting dummy campaigns:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}
