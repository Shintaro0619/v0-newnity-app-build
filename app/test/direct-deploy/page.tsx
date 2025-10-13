"use client"

import { useState } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { parseUnits } from "viem"

const ESCROW_ADDRESS = "0x6C52550E28152404c03f36089f9f652304C2AB51" as `0x${string}`

export default function DirectDeployPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [goalAmount, setGoalAmount] = useState("200")
  const [durationDays, setDurationDays] = useState("30")
  const [platformFee, setPlatformFee] = useState("500")
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleDirectDeploy = async () => {
    if (!walletClient || !publicClient || !address) {
      setError("Please connect your wallet")
      return
    }

    try {
      setIsLoading(true)
      setError("")
      setResult("")

      console.log("[v0] Starting direct deployment...")

      // Convert goal amount to wei (USDC has 6 decimals)
      const goalInWei = parseUnits(goalAmount, 6)

      console.log("[v0] Parameters:", {
        goalInWei: goalInWei.toString(),
        durationDays,
        platformFee,
      })

      // Call createCampaign directly with minimal gas
      const hash = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, BigInt(durationDays), BigInt(platformFee)],
        gas: 1000000n, // Use a very high gas limit
      })

      console.log("[v0] Transaction hash:", hash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      console.log("[v0] Transaction confirmed:", receipt)

      setResult(
        JSON.stringify(
          {
            success: true,
            hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
          },
          null,
          2,
        ),
      )
    } catch (err: any) {
      console.error("[v0] Direct deployment error:", err)
      setError(err.message || "Transaction failed")
      setResult(
        JSON.stringify(
          {
            success: false,
            error: err.message,
          },
          null,
          2,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Direct Transaction Tool</h1>
        <p className="text-gray-400 mb-8">
          Bypass the current implementation and send the transaction directly to the contract.
        </p>

        <div className="space-y-6">
          {/* Connect Wallet */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Connect Wallet</h2>
            <WalletConnectButton />
          </Card>

          {isConnected && (
            <>
              {/* Parameters */}
              <Card className="bg-gray-900 border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Campaign Parameters</h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goalAmount" className="text-gray-300">
                      Goal Amount (USDC)
                    </Label>
                    <Input
                      id="goalAmount"
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="durationDays" className="text-gray-300">
                      Duration (Days)
                    </Label>
                    <Input
                      id="durationDays"
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="platformFee" className="text-gray-300">
                      Platform Fee (Basis Points)
                    </Label>
                    <Input
                      id="platformFee"
                      type="number"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <p className="text-sm text-gray-500 mt-1">500 = 5%</p>
                  </div>

                  <Button onClick={handleDirectDeploy} disabled={isLoading} className="w-full">
                    {isLoading ? "Sending Transaction..." : "Send Direct Transaction"}
                  </Button>
                </div>
              </Card>

              {/* Results */}
              {(result || error) && (
                <Card className="bg-gray-900 border-gray-800 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Result</h2>

                  {error && (
                    <Alert className="bg-red-900/20 border-red-900 mb-4">
                      <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                  )}

                  {result && (
                    <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300">{result}</pre>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
