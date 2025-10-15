"use client"

import type React from "react"
import { useUser } from "@stackframe/stack"
import { useAccount } from "wagmi"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, User, Globe, FileText } from "lucide-react"
import Link from "next/link"
import { put } from "@vercel/blob"

export function ProfileSettingsClient() {
  const user = useUser()
  const { address } = useAccount()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    website: "",
    avatar: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || "",
        bio: "",
        website: "",
        avatar: user.profileImageUrl || "",
      })
      loadUserProfile()
    }
  }, [user])

  async function loadUserProfile() {
    if (!address) return

    try {
      const response = await fetch(`/api/users/${address}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || user?.displayName || "",
          bio: data.bio || "",
          website: data.website || "",
          avatar: data.avatar || user?.profileImageUrl || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

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
      const blob = await put(`avatars/${address}-${Date.now()}.${file.name.split(".").pop()}`, file, {
        access: "public",
      })

      setFormData((prev) => ({ ...prev, avatar: blob.url }))
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address) return

    setLoading(true)
    try {
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          name: formData.name,
          bio: formData.bio,
          website: formData.website,
          avatar: formData.avatar,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in and connect your wallet to edit your profile</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/handler/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your public profile information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a profile picture to personalize your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar || "/placeholder.svg"} alt={formData.name} />
                  <AvatarFallback className="text-2xl">
                    {formData.name?.charAt(0) || user.primaryEmail?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors w-fit">
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
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">This is how others will see you on newnity</p>
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
                <Input value={address} disabled className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Your connected wallet address (cannot be changed)</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
