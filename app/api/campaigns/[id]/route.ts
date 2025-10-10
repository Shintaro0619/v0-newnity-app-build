import { type NextRequest, NextResponse } from "next/server"
import { getCampaignById, updateCampaignBlockchainData } from "@/lib/actions/campaigns"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await getCampaignById(params.id)

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("[v0] Error fetching campaign:", error)
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const campaign = await updateCampaignBlockchainData(params.id, body)

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("[v0] Error updating campaign:", error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}
