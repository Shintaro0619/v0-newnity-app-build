import { type NextRequest, NextResponse } from "next/server"
import { getCampaigns } from "@/lib/actions/campaigns"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category") || undefined
    const status = searchParams.get("status") || "ACTIVE"
    const search = searchParams.get("search") || undefined

    const offset = (page - 1) * limit

    const campaigns = await getCampaigns({
      category,
      status,
      search,
      limit,
      offset,
    })

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: campaigns.length,
        pages: Math.ceil(campaigns.length / limit),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}
