import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useReadContract } from "wagmi"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { CAMPAIGN_ESCROW_ADDRESS } from "@/lib/contracts/contract-addresses"
import { formatUnits } from "viem"

interface CampaignCardProps {
  id: string // Changed from number to string to match database ID type
  title: string
  creator: string
  image: string
  raised?: number
  goal?: number
  backers?: number
  category: string
  daysLeft?: number
  status?: "live" | "upcoming" | "funded"
  blockchainCampaignId?: number // Renamed from onChainId for clarity
}

export function CampaignCard({
  id,
  title,
  creator,
  image,
  raised: initialRaised,
  goal: initialGoal,
  backers: initialBackers,
  category,
  daysLeft: initialDaysLeft,
  status = "live",
  blockchainCampaignId,
}: CampaignCardProps) {
  const { data: campaignData } = useReadContract({
    address: CAMPAIGN_ESCROW_ADDRESS,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getCampaign",
    args: blockchainCampaignId !== undefined ? [BigInt(blockchainCampaignId)] : undefined,
    query: {
      enabled: blockchainCampaignId !== undefined, // Only fetch if blockchain ID exists
      refetchInterval: 10000,
    },
  })

  const raised = campaignData ? Number(formatUnits(campaignData.totalPledged, 6)) : initialRaised || 0
  const goal = campaignData ? Number(formatUnits(campaignData.goal, 6)) : initialGoal || 100000
  const daysLeft = campaignData
    ? Math.max(0, Math.floor((Number(campaignData.deadline) - Date.now() / 1000) / 86400))
    : initialDaysLeft || 0

  const progress = goal > 0 ? (raised / goal) * 100 : 0

  return (
    <Link href={`/campaigns/${id}`} aria-label={`View ${title} campaign`} className="block h-full">
      <Card className="overflow-hidden bg-gray-900 border-gray-800 hover:border-primary/40 transition-all group h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">{daysLeft} days left</span>
          </div>
          {status === "upcoming" && (
            <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-black border-0">Featured</Badge>
          )}
          {status === "funded" && (
            <Badge className="absolute top-2 left-2 bg-green-500/90 text-black border-0">Funded</Badge>
          )}
          {status === "live" && (
            <Badge className="absolute top-2 left-2 bg-primary/90 text-black border-0">Featured</Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <Badge className="mb-2 bg-primary/20 text-primary border-primary/40 text-xs w-fit">{category}</Badge>
          <h3 className="text-base font-bold text-white mb-1 line-clamp-2">{title}</h3>
          <p className="text-xs text-gray-400 mb-3">by {creator}</p>

          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-bold">${raised.toLocaleString()} USDC</span>
              <span className="text-gray-500 text-xs">
                {Math.round(progress)}% / ${goal.toLocaleString()}
              </span>
            </div>
            <Progress value={progress} className="h-1.5 bg-gray-800" />
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {initialBackers} backers
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysLeft} days left
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function Users({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
