import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const blockchainId = Number.parseInt(params.id)

    if (isNaN(blockchainId)) {
      return NextResponse.json({ error: "Invalid blockchain campaign ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM campaigns
      WHERE blockchain_campaign_id = ${blockchainId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching campaign by blockchain ID:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
