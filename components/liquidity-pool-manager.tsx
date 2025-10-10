"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Droplets, TrendingUp, AlertTriangle, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { LiquidityPoolManager } from "@/lib/defi-protocols"

interface LiquidityPosition {
  id: string
  token0: string
  token1: string
  token0Amount: number
  token1Amount: number
  liquidity: number
  feesEarned: number
  impermanentLoss: number
}

interface LiquidityPoolManagerProps {
  campaignId: number
  availableUSDC: number
  availableETH: number
  isCreator: boolean
}

export function LiquidityPoolManagerComponent({
  campaignId,
  availableUSDC,
  availableETH,
  isCreator,
}: LiquidityPoolManagerProps) {
  const [usdcAmount, setUsdcAmount] = useState("")
  const [ethAmount, setEthAmount] = useState("")
  const [priceRange, setPriceRange] = useState([1800, 2200]) // ETH price range
  const [positions, setPositions] = useState<LiquidityPosition[]>([])

  const { address } = useAccount()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })

  // Calculate LP position details
  const currentETHPrice = 2000 // Mock current ETH price
  const lpCalculation = LiquidityPoolManager.calculateLPPosition(
    Number.parseFloat(usdcAmount) || 0,
    Number.parseFloat(ethAmount) || 0,
    currentETHPrice,
    { min: priceRange[0], max: priceRange[1] },
  )

  const handleCreatePosition = async () => {
    if (!address || !usdcAmount || !ethAmount) {
      toast.error("Please enter valid amounts for both tokens")
      return
    }

    try {
      // This would interact with Uniswap V3 to create LP position
      toast.success("Liquidity position created!")
      setUsdcAmount("")
      setEthAmount("")
    } catch (error) {
      console.error("LP creation failed:", error)
      toast.error("Failed to create liquidity position")
    }
  }

  const handleRemovePosition = async (positionId: string) => {
    try {
      // This would remove the LP position
      toast.success("Liquidity position removed!")
    } catch (error) {
      console.error("LP removal failed:", error)
      toast.error("Failed to remove liquidity position")
    }
  }

  const totalLiquidity = positions.reduce((sum, pos) => sum + pos.liquidity, 0)
  const totalFeesEarned = positions.reduce((sum, pos) => sum + pos.feesEarned, 0)
  const totalImpermanentLoss = positions.reduce((sum, pos) => sum + pos.impermanentLoss, 0)

  if (!isCreator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Liquidity Pool Management</CardTitle>
          <CardDescription>Only campaign creators can manage liquidity positions</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Liquidity</p>
                <p className="text-2xl font-bold">${totalLiquidity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Fees Earned</p>
                <p className="text-2xl font-bold text-green-500">+${totalFeesEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Impermanent Loss</p>
                <p className="text-2xl font-bold text-orange-500">-${totalImpermanentLoss.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Liquidity Position
          </CardTitle>
          <CardDescription>Provide liquidity to USDC/ETH pool and earn trading fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Available USDC</p>
              <p className="text-lg font-bold">{availableUSDC.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Available ETH</p>
              <p className="text-lg font-bold">{availableETH.toFixed(4)}</p>
            </div>
          </div>

          {/* Token Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usdc-amount">USDC Amount</Label>
              <Input
                id="usdc-amount"
                type="number"
                placeholder="0.00"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                max={availableUSDC}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eth-amount">ETH Amount</Label>
              <Input
                id="eth-amount"
                type="number"
                placeholder="0.00"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                max={availableETH}
                step="0.0001"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label>Price Range (ETH/USDC)</Label>
            <div className="px-3">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={1000}
                max={3000}
                step={50}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Min: ${priceRange[0]}</span>
              <span>Current: ${currentETHPrice}</span>
              <span>Max: ${priceRange[1]}</span>
            </div>
          </div>

          {/* Position Preview */}
          {usdcAmount && ethAmount && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Position Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Optimal USDC:</span> $
                    {lpCalculation.optimalToken0.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Optimal ETH:</span>{" "}
                    {lpCalculation.optimalToken1.toFixed(4)}
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">Expected Fees:</span> $
                    {lpCalculation.expectedFees.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">IL Risk:</span>{" "}
                    {(lpCalculation.impermanentLossRisk * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Create Position Button */}
          <Button
            onClick={handleCreatePosition}
            disabled={
              !usdcAmount ||
              !ethAmount ||
              Number.parseFloat(usdcAmount) > availableUSDC ||
              Number.parseFloat(ethAmount) > availableETH ||
              isPending ||
              isTxLoading
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {(isPending || isTxLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Liquidity Position
          </Button>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>Monitor and manage your liquidity positions</CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active liquidity positions</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first position to start earning fees</p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <Card key={position.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {position.token0}/{position.token1}
                      </h4>
                      <p className="text-sm text-muted-foreground">Position ID: {position.id}</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{position.token0} Amount</p>
                      <p className="font-medium">{position.token0Amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{position.token1} Amount</p>
                      <p className="font-medium">{position.token1Amount.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fees Earned</p>
                      <p className="font-medium text-green-500">+${position.feesEarned.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Impermanent Loss</p>
                      <p className="font-medium text-orange-500">-${position.impermanentLoss.toFixed(2)}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRemovePosition(position.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Remove Position
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
