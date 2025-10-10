"use client"

import { useState } from "react"
import { useAccount, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Network, ChevronDown, Check } from "lucide-react"
import { SUPPORTED_CHAINS, getChainName, isChainSupported } from "@/lib/wagmi"
import { toast } from "sonner"

export function ChainSelector() {
  const { chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)

  const handleChainSwitch = async (chainId: number) => {
    try {
      await switchChain({ chainId })
      setIsOpen(false)
      toast.success(`Switched to ${getChainName(chainId)}`)
    } catch (error) {
      console.error("Chain switch failed:", error)
      toast.error("Failed to switch network")
    }
  }

  if (!chain) return null

  const isSupported = isChainSupported(chain.id)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${!isSupported ? "border-red-500 text-red-500" : ""}`}
          disabled={isPending}
        >
          <Network className="h-4 w-4" />
          <span className="hidden sm:inline">{chain.name}</span>
          {!isSupported && (
            <Badge variant="destructive" className="text-xs">
              Unsupported
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_CHAINS.map((supportedChain) => (
          <DropdownMenuItem
            key={supportedChain.id}
            onClick={() => handleChainSwitch(supportedChain.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span>{supportedChain.name}</span>
            </div>
            {chain.id === supportedChain.id && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>
        ))}

        {!isSupported && (
          <>
            <div className="px-2 py-1">
              <div className="border-t border-border" />
            </div>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Current network ({chain.name}) is not supported
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
