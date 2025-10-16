import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params

    const users = await sql`
      SELECT 
        id,
        email,
        name,
        avatar,
        bio,
        website,
        wallet_address,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(wallet_address) = LOWER(${address})
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
