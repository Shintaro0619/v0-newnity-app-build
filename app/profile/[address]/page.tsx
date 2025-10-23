import { ProfilePageClient } from "./profile-page-client"
import { getCampaignsByCreator } from "@/lib/actions/campaigns"
import { sql } from "@/lib/db"
import RequireWallet from "@/components/guards/require-wallet"

interface PageProps {
  params: Promise<{ address: string }>
}

async function getUserProfile(address: string) {
  try {
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
      return null
    }

    return users[0]
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

export const dynamic = "force-dynamic"

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params

  const [userProfile, campaigns] = await Promise.all([getUserProfile(address), getCampaignsByCreator(address)])

  return (
    <RequireWallet>
      <ProfilePageClient userProfile={userProfile} campaigns={campaigns} address={address} />
    </RequireWallet>
  )
}
