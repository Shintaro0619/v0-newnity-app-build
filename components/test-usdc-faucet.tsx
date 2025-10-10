"use client"

import { useState, useEffect } from "react"
import { useAccount, useChainId } from "wagmi"
import { useTestUSDC } from "@/lib/hooks/use-test-usdc"
import { getUSDCAddress, CAMPAIGN_ESCROW_ADDRESS } from "@/lib/contracts/contract-addresses"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Droplet, Wallet, AlertCircle, CheckCircle, Copy } from "lucide-react"

export function TestUSDCFaucet() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { mintTestUSDC, isPending, isSuccess, error, balance, refetchBalance } = useTestUSDC()
  const [amount, setAmount] = useState("1000")
  const [copied, setCopied] = useState(false)

  const usdcAddress = getUSDCAddress(chainId)
  const isMockUSDC = usdcAddress.toLowerCase() === "0xc08b4c06ebd87df46c28b620e71463bd7567f9bb"
  const isRealUSDC = usdcAddress.toLowerCase() === "0x036cbd53842c5426634e7929541ec2318f3dcf7e"

  useEffect(() => {
    console.log("[v0] USDC Address Check:", {
      usdcAddress,
      isMockUSDC,
      isRealUSDC,
      chainId,
    })
  }, [usdcAddress, isMockUSDC, isRealUSDC, chainId])

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetchBalance()
      }, 2000)
    }
  }, [isSuccess, refetchBalance])

  const handleMint = async () => {
    if (!isConnected) return
    console.log("[v0] Attempting to mint USDC:", { amount, usdcAddress, chainId })
    await mintTestUSDC(amount)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(usdcAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return null
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <Droplet className="h-6 w-6 text-blue-500" />
        <h3 className="text-xl font-bold text-white">Test USDC Faucet</h3>
      </div>

      {isMockUSDC && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 text-sm font-semibold mb-1">Mock USDC Ready</p>
              <p className="text-green-300 text-xs">You can freely mint test USDC tokens for testing campaigns.</p>
            </div>
          </div>
        </div>
      )}

      {isRealUSDC && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-semibold mb-1">Warning: Using Real USDC</p>
              <p className="text-red-300 text-xs">
                The real USDC contract does not have a public mint function. Please set
                NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA environment variable to a mock USDC contract address.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-gray-400 text-sm mb-4">
        Get test USDC tokens for Base Sepolia to try out pledging to campaigns.
      </p>

      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Your Balance</span>
          </div>
          <span className="text-lg font-bold text-white">{balance} USDC</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Amount (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            placeholder="1000"
          />
        </div>

        <Button
          onClick={handleMint}
          disabled={isPending || !amount || isRealUSDC}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting...
            </>
          ) : (
            <>
              <Droplet className="mr-2 h-4 w-4" />
              Mint {amount} USDC
            </>
          )}
        </Button>

        {isMockUSDC && (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-800 rounded text-xs text-gray-300 font-mono break-all">
              {usdcAddress}
            </code>
            <Button
              onClick={copyAddress}
              size="sm"
              variant="outline"
              className="border-blue-500/50 hover:bg-blue-900/30 bg-transparent"
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {isSuccess && <p className="text-green-500 text-sm">Successfully minted {amount} USDC!</p>}

        {error && <p className="text-red-500 text-sm">Error: {error.message}</p>}
      </div>

      {isMockUSDC && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Add USDC to MetaMask</h4>
          <p className="text-blue-300 text-xs mb-3">To see your USDC balance in MetaMask, manually add the token:</p>
          <ol className="text-blue-300 text-xs space-y-1 mb-3 list-decimal list-inside">
            <li>Open MetaMask</li>
            <li>Click "Tokens" tab → "Import tokens"</li>
            <li>Paste the contract address below</li>
            <li>Symbol: USDC, Decimals: 6</li>
            <li>Click "Import"</li>
          </ol>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-800">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Contract Addresses</h4>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-gray-500">Campaign Escrow:</span>
            <p className="text-gray-300 font-mono break-all">{CAMPAIGN_ESCROW_ADDRESS}</p>
          </div>
          <div>
            <span className="text-gray-500">USDC (Base Sepolia):</span>
            <p
              className={`font-mono break-all ${isRealUSDC ? "text-red-400" : isMockUSDC ? "text-green-400" : "text-gray-300"}`}
            >
              {usdcAddress}
            </p>
            {isRealUSDC && <p className="text-red-400 text-xs mt-1">⚠️ Real USDC - Cannot mint</p>}
            {isMockUSDC && <p className="text-green-400 text-xs mt-1">✓ Mock USDC - Ready to mint</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}
