import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface CampaignCardProps {
  id: string
  title: string
  creator: string
  image: string
  raised?: number
  goal?: number
  backers?: number
  category: string
  daysLeft?: number
  status?: "live" | "upcoming" | "funded" | "failed" | "ended"
  blockchainCampaignId?: number
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
}: CampaignCardProps) {
  const raised = initialRaised || 0
  const goal = initialGoal || 100000
  const daysLeft = initialDaysLeft || 0

  const progress = goal > 0 ? (raised / goal) * 100 : 0

  const isEnded = status === "failed" || status === "funded" || status === "ended" || daysLeft === 0

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
          {isEnded ? (
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <span className="text-xs font-medium text-gray-400">ENDED</span>
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <span className="text-xs">⏰</span>
              <span className="text-xs font-medium text-white">{daysLeft} days left</span>
            </div>
          )}
          {status === "upcoming" && (
            <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-black border-0">Featured</Badge>
          )}
          {status === "funded" && (
            <Badge className="absolute top-2 left-2 bg-green-500/90 text-black border-0">Funded</Badge>
          )}
          {status === "failed" && (
            <Badge className="absolute top-2 left-2 bg-red-500/90 text-white border-0">Failed</Badge>
          )}
          {status === "live" && !isEnded && (
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
                <span>👥</span>
                {initialBackers || 0} backers
              </span>
              <span className="flex items-center gap-1">
                <span>⏰</span>
                {daysLeft} days left
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
