"use client"

import { useAccount } from "wagmi"
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
import { User, LayoutDashboard, Settings } from "lucide-react"
import Link from "next/link"
import { getUserProfile } from "@/app/settings/actions"

export function AuthButton() {
  const { address, isConnected } = useAccount()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (address && isConnected) {
        setUserProfile(null)
        setIsLoading(true)

        try {
          console.log("[v0] [CLIENT] Loading profile for:", address)
          const data = await getUserProfile(address)
          if (data.profile) {
            console.log("[v0] [CLIENT] Profile loaded:", data.profile.name)
            setUserProfile(data.profile)
          } else {
            console.log("[v0] [CLIENT] No profile found for:", address)
          }
        } catch (error) {
          console.error("[v0] [CLIENT] Error loading profile:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setUserProfile(null)
      }
    }
    loadProfile()
  }, [address, isConnected])

  if (!isConnected || !address) {
    return null
  }

  const displayName = `${address.slice(0, 6)}...${address.slice(-4)}`

  const profileMatches = userProfile?.wallet_address?.toLowerCase() === address?.toLowerCase()
  const showProfile = profileMatches && !isLoading

  if (!showProfile && userProfile) {
    console.log("[v0] [CLIENT] Profile/address mismatch, showing address-only:", {
      profileAddress: userProfile?.wallet_address,
      currentAddress: address,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
