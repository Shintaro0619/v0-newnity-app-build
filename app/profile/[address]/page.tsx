import { ProfilePageClient } from "./profile-page-client"
import { notFound } from "next/navigation"
import { getCampaignsByCreator } from "@/lib/actions/campaigns"

interface PageProps {
  params: Promise<{ address: string }>
}

async function getUserProfile(address: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users/${address}`,
      {
        cache: "no-store",
      },
    )
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

export const dynamic = "force-dynamic"

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params
  const [userProfile, campaigns] = await Promise.all([getUserProfile(address), getCampaignsByCreator(address)])

  if (!userProfile) {
    notFound()
  }

  return <ProfilePageClient userProfile={userProfile} campaigns={campaigns} />
}
