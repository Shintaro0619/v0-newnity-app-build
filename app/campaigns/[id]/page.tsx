import { getCampaignById } from "@/lib/actions/campaigns"
import { CampaignDetailClient } from "@/components/campaigns/campaign-detail-client"
import { notFound } from "next/navigation"

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  console.log("[v0] Fetching campaign with ID:", params.id)

  try {
    const campaign = await getCampaignById(params.id)

    if (!campaign) {
      console.log("[v0] Campaign not found:", params.id)
      notFound()
    }

    console.log("[v0] Campaign loaded successfully:", campaign.title)
    return <CampaignDetailClient campaign={campaign} />
  } catch (error) {
    console.error("[v0] Error loading campaign:", error)
    notFound()
  }
}
