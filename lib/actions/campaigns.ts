"use server"

import { sql } from "@/lib/db"

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
}) {
  try {
    // Build WHERE conditions
    const conditions: string[] = ["1=1"]

    if (filters?.category && filters.category !== "all") {
      conditions.push(`c.category = '${filters.category}'`)
    }

    if (filters?.status) {
      conditions.push(`c.status = '${filters.status}'`)
    }

    if (filters?.search) {
      const searchTerm = filters.search.replace(/'/g, "''") // Escape single quotes
      conditions.push(`(c.title ILIKE '%${searchTerm}%' OR c.description ILIKE '%${searchTerm}%')`)
    }

    const whereClause = conditions.join(" AND ")
    const limitClause = filters?.limit ? `LIMIT ${filters.limit}` : ""
    const offsetClause = filters?.offset ? `OFFSET ${filters.offset}` : ""

    // Use tagged template literal
    const campaigns = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        COUNT(DISTINCT p.id) as backers_count
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
      WHERE ${sql.unsafe(whereClause)}
      GROUP BY c.id, u.name, u.avatar 
      ORDER BY c.created_at DESC
      ${sql.unsafe(limitClause)}
      ${sql.unsafe(offsetClause)}
    `

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
    const result = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.avatar as creator_avatar,
        u.bio as creator_bio,
        u.wallet_address as creator_wallet,
        COUNT(DISTINCT p.id) as backers_count,
        COALESCE(SUM(p.amount), 0) as total_pledged
      FROM campaigns c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN pledges p ON c.id = p.campaign_id AND p.status = 'CONFIRMED'
      WHERE c.id = ${id}
      GROUP BY c.id, u.name, u.avatar, u.bio, u.wallet_address
    `

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
    return null
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

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + data.duration)

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
        NOW(),
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
    const updates: string[] = []

    if (data.blockchain_campaign_id !== undefined) {
      updates.push(`blockchain_campaign_id = ${data.blockchain_campaign_id}`)
    }

    if (data.contract_tx_hash) {
      updates.push(`contract_tx_hash = '${data.contract_tx_hash}'`)
    }

    if (data.escrow_address) {
      updates.push(`escrow_address = '${data.escrow_address}'`)
    }

    if (data.raised_amount !== undefined) {
      updates.push(`raised_amount = ${data.raised_amount}`)
    }

    if (data.status) {
      updates.push(`status = '${data.status}'`)
    }

    if ((data.blockchain_campaign_id !== undefined || data.contract_tx_hash) && !data.status) {
      updates.push(`status = 'ACTIVE'`)
    }

    updates.push(`updated_at = NOW()`)

    const setClause = updates.join(", ")

    const result = await sql`
      UPDATE campaigns 
      SET ${sql.unsafe(setClause)}
      WHERE id = ${campaignId}
      RETURNING *
    `

    console.log("[v0] Campaign updated with blockchain data:", result[0])
    return result[0]
  } catch (error) {
    console.error("[v0] Error updating campaign blockchain data:", error)
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
  blockNumber?: number
}) {
  try {
    // Ensure user exists
    const userId = await ensureUserExists(data.backerWalletAddress)

    // Create pledge and update campaign raised amount in a transaction
    const result = await sql.begin(async (sql) => {
      // Insert pledge
      const pledge = await sql`
        INSERT INTO pledges (
          id,
          campaign_id,
          backer_id,
          amount,
          currency,
          status,
          tx_hash,
          block_number,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${data.campaignId},
          ${userId},
          ${data.amount},
          'USDC',
          'CONFIRMED',
          ${data.txHash},
          ${data.blockNumber || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `

      // Update campaign raised amount
      await sql`
        UPDATE campaigns
        SET 
          raised_amount = raised_amount + ${data.amount},
          updated_at = NOW()
        WHERE id = ${data.campaignId}
      `

      return pledge[0]
    })

    console.log("[v0] Pledge saved to database:", result)
    return result
  } catch (error) {
    console.error("[v0] Error saving pledge to database:", error)
    throw error
  }
}
