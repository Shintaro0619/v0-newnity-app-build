import { CampaignGrid } from "@/components/campaigns/campaign-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Discover Campaigns - newnity",
  description: "Discover and filter innovative campaigns on newnity. Support creators with USDC.",
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-black">
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Discover Campaigns</h1>
            <p className="text-gray-400">Find and support innovative projects that match your interests</p>
          </div>

          <CampaignGrid />
        </div>
      </main>
    </div>
  )
}
