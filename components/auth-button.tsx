"use client"

import { useAccount, useDisconnect } from "wagmi"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getUserProfile } from "@/app/settings/actions"
import { User } from "lucide-react"

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export function AuthButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setUserProfile(null)
      return
    }

    async function loadProfile() {
      setIsLoading(true)
      try {
        const data = await getUserProfile(address)
        if (data.profile && data.profile.wallet_address?.toLowerCase() === address?.toLowerCase()) {
          setUserProfile(data.profile)
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error("[v0] [AUTH_BUTTON] Error loading profile:", error)
        setUserProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [address, isConnected])

  if (!isConnected || !address) return null

  const label = userProfile?.name || shortAddr(address)

  const hardDisconnect = () => {
    disconnect()
    try {
      localStorage.removeItem("newnity_profile")
      localStorage.removeItem("newnity_account")
    } catch {}
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 hover:bg-green-500 hover:text-black transition-colors">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem asChild>
          <Link href={`/profile/${address}`}>View Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Edit Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={hardDisconnect} className="text-red-500">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
