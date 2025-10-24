"use client"

import { useAccount, useDisconnect } from "wagmi"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LayoutDashboard, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { getUserProfile } from "@/app/settings/actions"
import { useProfileStore } from "@/lib/stores/profile"

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

  if (!isConnected || !address) {
    return null
  }

  const displayName = `${address.slice(0, 6)}...${address.slice(-4)}`
  const profileMatches = userProfile?.wallet_address?.toLowerCase() === address?.toLowerCase()
  const showProfile = profileMatches && !isLoading

  const handleDisconnect = () => {
    clearProfile()
    setCurrentAddress(undefined)
    disconnect()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 rounded-full px-3 gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={showProfile && userProfile.avatar ? userProfile.avatar : undefined}
              alt={showProfile ? userProfile.name : displayName}
            />
            <AvatarFallback className="bg-primary/20 text-primary">
              {showProfile && userProfile.name
                ? userProfile.name.charAt(0).toUpperCase()
                : displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-white">
            {showProfile && userProfile.name ? userProfile.name : displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={showProfile && userProfile.avatar ? userProfile.avatar : undefined}
              alt={showProfile ? userProfile.name : displayName}
            />
            <AvatarFallback className="bg-primary/20 text-primary">
              {showProfile && userProfile.name
                ? userProfile.name.charAt(0).toUpperCase()
                : displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-white">{showProfile && userProfile.name ? userProfile.name : displayName}</p>
            <p className="w-[160px] truncate text-xs text-gray-400">{address}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
          <Link href={`/profile/${address}`} className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer">
          <Link href="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-red-400 hover:bg-gray-800 hover:text-red-300 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
