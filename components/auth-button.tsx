"use client"

import { useAccount, useDisconnect } from "wagmi"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getUserProfile } from "@/app/settings/actions"
import { useProfileStore } from "@/lib/stores/profile"

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export function AuthButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | undefined>(undefined)

  const userProfile = useProfileStore((state) => state.profile)
  const setUserProfile = useProfileStore((state) => state.setProfile)
  const clearProfile = useProfileStore((state) => state.clear)

  useEffect(() => {
    if (!isConnected || !address) {
      clearProfile()
      setCurrentAddress(undefined)
      return
    }

    if (currentAddress && currentAddress !== address) {
      clearProfile()
    }

    setCurrentAddress(address)
  }, [address, isConnected, currentAddress, clearProfile])

  useEffect(() => {
    if (!isConnected || !address) {
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
  }, [address, isConnected, setUserProfile])

  if (!isConnected || !address) return null

  const label = shortAddr(address)

  const hardDisconnect = () => {
    try {
      disconnect()
    } finally {
      try {
        localStorage.removeItem("newnity_profile")
      } catch {}
      try {
        localStorage.removeItem("newnity_account")
      } catch {}
    }
  }

  const showProfile = userProfile?.wallet_address?.toLowerCase() === address?.toLowerCase() && !isLoading

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 hover:bg-green-500 hover:text-black">
          <Avatar className="h-8 w-8">
            <AvatarImage src={showProfile && userProfile.avatar ? userProfile.avatar : `/api/avatar/${address}`} />
            <AvatarFallback>
              {showProfile && userProfile.name ? userProfile.name.charAt(0).toUpperCase() : label.slice(2, 4)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium">
            {showProfile && userProfile.name ? userProfile.name : label}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="z-[1000] w-56 bg-gray-900 border-gray-700" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={showProfile && userProfile.avatar ? userProfile.avatar : `/api/avatar/${address}`} />
            <AvatarFallback>
              {showProfile && userProfile.name ? userProfile.name.charAt(0).toUpperCase() : label.slice(2, 4)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-white">{showProfile && userProfile.name ? userProfile.name : label}</p>
            <p className="w-[160px] truncate text-xs text-gray-400">{address}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
          <Link href={`/profile/${address}`}>View Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
          <Link href="/settings">Edit Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={hardDisconnect}
          className="text-red-500 hover:bg-gray-800 hover:text-red-300 cursor-pointer"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
