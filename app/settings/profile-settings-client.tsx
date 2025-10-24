"use client"

import type React from "react"
import { useAccount } from "wagmi"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, User, Globe, FileText, Mail } from "lucide-react"
import Link from "next/link"
import { getUserProfile, updateUserProfile, uploadAvatar } from "./actions"

console.log("[v0] [CLIENT] ProfileSettingsClient module loaded")

export function ProfileSettingsClient() {
  console.log("[v0] [CLIENT] ProfileSettingsClient component rendering")

  const { address, isConnected } = useAccount()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const prevIsConnected = useRef(isConnected)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    avatar: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    email: "",
  })

  console.log("[v0] [CLIENT] Account state:", { address, isConnected })

  const loadUserProfile = useCallback(async () => {
    if (!address) return

    try {
      console.log("[v0] [CLIENT] Loading profile for address:", address)
      console.log("[v0] [CLIENT] Calling getUserProfile Server Action...")

      const data = await getUserProfile(address)

      console.log("[v0] [CLIENT] Server Action returned:", data)

      if (data.profile) {
        setFormData({
          name: data.profile.name || "",
          email: data.profile.email || "",
          bio: data.profile.bio || "",
          website: data.profile.website || "",
          avatar: data.profile.avatar || "",
        })
        console.log("[v0] [CLIENT] Profile loaded successfully")
      } else {
        console.log("[v0] [CLIENT] No profile found, using empty form")
      }
    } catch (error) {
      console.error("[v0] [CLIENT] Error loading profile:", error)
      console.error("[v0] [CLIENT] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      console.log("[v0] [CLIENT] Using empty form due to error")
    } finally {
      setInitialLoading(false)
    }
  }, [address])

  useEffect(() => {
    // Check if wallet was connected and is now disconnected
    if (prevIsConnected.current && !isConnected) {
      console.log("[v0] [CLIENT] Wallet disconnected, redirecting to home...")
      toast({
        title: "Wallet Disconnected",
        description: "Redirecting to home page...",
      })
      router.push("/")
    }
    // Update the ref with current connection state
    prevIsConnected.current = isConnected
  }, [isConnected, router, toast])

  useEffect(() => {
    console.log("[v0] [CLIENT] useEffect triggered, address:", address, "isConnected:", isConnected)
    if (address && isConnected) {
      loadUserProfile()
    } else {
      setInitialLoading(false)
    }
  }, [address, isConnected, loadUserProfile])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !address) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      console.log("[v0] [CLIENT] Uploading avatar via Server Action...")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("address", address)

      const result = await uploadAvatar(formData)

      console.log("[v0] [CLIENT] Avatar uploaded successfully:", result.url)

      setFormData((prev) => ({ ...prev, avatar: result.url }))
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] [CLIENT] Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  function validateForm(): boolean {
    const newErrors = {
      name: "",
      email: "",
    }

    if (!formData.name.trim()) {
      newErrors.name = "Display name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.email
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address) return

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] [CLIENT] Submitting profile update:", formData)
      console.log("[v0] [CLIENT] Calling updateUserProfile Server Action...")

      const result = await updateUserProfile({
        address,
        ...formData,
      })

      if (!result.success) {
        console.log("[v0] [CLIENT] Profile update failed:", result.error)
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      console.log("[v0] [CLIENT] Profile updated successfully")
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      router.replace(`/profile/${address}`)
    } catch (error) {
      console.error("[v0] [CLIENT] Error updating profile:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again."

      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your public profile information</p>
        </div>

        {!isConnected || !address ? (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>Wallet Not Connected</CardTitle>
              <CardDescription>Please connect your wallet to edit your profile</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Upload a profile picture to personalize your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="h-24 w-24 flex-shrink-0">
                    <AvatarImage src={formData.avatar || undefined} alt={formData.name} />
                    <AvatarFallback className="text-2xl">
                      {formData.name?.charAt(0) || address.charAt(2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors w-full sm:w-fit">
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </div>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="h-4 w-4 inline mr-2" />
                    Display Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                    }}
                    placeholder="Your name"
                    maxLength={50}
                    className={errors.name ? "border-destructive" : ""}
                    required
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  <p className="text-xs text-muted-foreground">This is how others will see you on newnity</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                    }}
                    placeholder="your.email@example.com"
                    className={errors.email ? "border-destructive" : ""}
                    required
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  <p className="text-xs text-muted-foreground">Your email address for notifications and updates</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <Input value={address} disabled className="font-mono text-xs sm:text-sm break-all" />
                  <p className="text-xs text-muted-foreground">Your connected wallet address (cannot be changed)</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
