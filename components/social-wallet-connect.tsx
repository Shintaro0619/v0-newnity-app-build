"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Github, Mail, Twitter, Wallet, Zap } from "lucide-react"
import { WalletConnectButton } from "./wallet-connect-button"
import { SOCIAL_LOGIN_CONFIG } from "@/lib/account-abstraction"

interface SocialWalletConnectProps {
  onSocialLogin?: (provider: string) => void
}

export function SocialWalletConnect({ onSocialLogin }: SocialWalletConnectProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider)
    try {
      // Simulate social login process
      await new Promise((resolve) => setTimeout(resolve, 2000))
      onSocialLogin?.(provider)
    } catch (error) {
      console.error(`${provider} login failed:`, error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          Connect to newnity
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            AA Enabled
          </Badge>
        </CardTitle>
        <CardDescription>Choose your preferred connection method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Login Options */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Social Login (Gasless)</p>

          {SOCIAL_LOGIN_CONFIG.google.enabled && (
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading === "google"}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isLoading === "google" ? "Connecting..." : "Continue with Google"}
            </Button>
          )}

          {SOCIAL_LOGIN_CONFIG.github.enabled && (
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => handleSocialLogin("github")}
              disabled={isLoading === "github"}
            >
              <Github className="mr-2 h-4 w-4" />
              {isLoading === "github" ? "Connecting..." : "Continue with GitHub"}
            </Button>
          )}

          {SOCIAL_LOGIN_CONFIG.twitter.enabled && (
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => handleSocialLogin("twitter")}
              disabled={isLoading === "twitter"}
            >
              <Twitter className="mr-2 h-4 w-4" />
              {isLoading === "twitter" ? "Connecting..." : "Continue with Twitter"}
            </Button>
          )}

          {/* Fallback when no social providers configured */}
          {!SOCIAL_LOGIN_CONFIG.google.enabled &&
            !SOCIAL_LOGIN_CONFIG.github.enabled &&
            !SOCIAL_LOGIN_CONFIG.twitter.enabled && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Social login not configured</p>
                <p className="text-xs text-muted-foreground mt-1">Set environment variables to enable social login</p>
              </div>
            )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Traditional Wallet Connection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Crypto Wallet</p>
          <div className="flex items-center justify-center">
            <WalletConnectButton />
          </div>
        </div>

        {/* AA Benefits */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs font-medium mb-2">Account Abstraction Benefits:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Gasless transactions
            </li>
            <li className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Social recovery options
            </li>
            <li className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email/social login support
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
