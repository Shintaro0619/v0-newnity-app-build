import { getCampaignById } from "@/lib/actions/campaigns"
import { CampaignDetailClient } from "@/components/campaigns/campaign-detail-client"
import { notFound } from "next/navigation"

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id)

  if (!campaign) {
    notFound()
  }

  return <CampaignDetailClient campaign={campaign} />
}
