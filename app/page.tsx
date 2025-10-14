import { FeaturedRail } from "@/components/campaigns/featured-rail"
import { NewRail } from "@/components/campaigns/new-rail"
import { TrendingRail } from "@/components/campaigns/trending-rail"
import { CategoryRail } from "@/components/campaigns/category-rail"
import { CampaignSidebar } from "@/components/campaigns/campaign-sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Campaigns - newnity | USDC Crowdfunding Platform",
  description:
    "Discover innovative campaigns on newnity. Support creators with USDC. Transparent escrow, fair fees, and real relationships.",
  openGraph: {
    title: "Campaigns - newnity",
    description: "Discover innovative campaigns on newnity. Support creators with USDC.",
    type: "website",
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Reduced width from w-64 to w-56 */}
            <CampaignSidebar />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Campaigns</h1>
                  <p className="text-gray-400">Discover and support innovative projects on newnity</p>
                </div>
                <Link href="/discover">
                  <Button
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10 bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>

              <FeaturedRail />
              <NewRail />
              <TrendingRail />
              <CategoryRail />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
