"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, DollarSign, Zap, Target, Loader2, AirVent as Harvest } from "lucide-react"
import { toast } from "sonner"
import { DeFiManager, YieldStrategy, NEWNITY_YIELD_VAULT_ABI } from "@/lib/defi-protocols"

interface YieldPosition {
  campaignId: number
  strategy: YieldStrategy
  deposited: number
  shares: number
  currentValue: number
  totalYield: number
  apy: number
}

interface YieldFarmingDashboardProps {
  campaignId: number
  availableFunds: number
  isCreator: boolean
}

export function YieldFarmingDashboard({ campaignId, availableFunds, isCreator }: YieldFarmingDashboardProps) {
  const [depositAmount, setDepositAmount] = useState("")
  const [selectedStrategy, setSelectedStrategy] = useState<YieldStrategy>(YieldStrategy.COMPOUND)
  const [estimatedAPY, setEstimatedAPY] = useState(0)
  const [positions, setPositions] = useState<YieldPosition[]>([])

  const { address, chain } = useAccount()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({ hash: txHash })

  // Get yield vault address
  const yieldVaultAddress = chain ? DeFiManager.getProtocolAddress(chain.id, "NEWNITY_YIELD_VAULT") : undefined

  // Read user shares
  const { data: userShares } = useReadContract({
    address: yieldVaultAddress,
    abi: NEWNITY_YIELD_VAULT_ABI,
    functionName: "getUserShares",
    args: address ? [BigInt(campaignId), address] : undefined,
  })

  // Read total yield
  const { data: totalYield } = useReadContract({
    address: yieldVaultAddress,
    abi: NEWNITY_YIELD_VAULT_ABI,
    functionName: "getTotalYield",
    args: [BigInt(campaignId)],
  })

  // Update estimated APY when strategy or amount changes
  useEffect(() => {
    const updateAPY = async () => {
      if (depositAmount) {
        const apy = await DeFiManager.estimateAPY(selectedStrategy, Number.parseFloat(depositAmount))
        setEstimatedAPY(apy)
      }
    }
    updateAPY()
  }, [selectedStrategy, depositAmount])

  const handleDeposit = async () => {
    if (!yieldVaultAddress || !depositAmount) {
      toast.error("Please enter a valid deposit amount")
      return
    }

    try {
      await writeContract({
        address: yieldVaultAddress,
        abi: NEWNITY_YIELD_VAULT_ABI,
        functionName: "deposit",
        args: [BigInt(campaignId), BigInt(Number.parseFloat(depositAmount) * 1e6), selectedStrategy],
      })

      toast.success("Funds deposited to yield farming!")
      setDepositAmount("")
    } catch (error) {
      console.error("Deposit failed:", error)
      toast.error("Failed to deposit funds")
    }
  }

  const handleWithdraw = async (shares: number) => {
    if (!yieldVaultAddress) {
      toast.error("Yield vault not available")
      return
    }

    try {
      await writeContract({
        address: yieldVaultAddress,
        abi: NEWNITY_YIELD_VAULT_ABI,
        functionName: "withdraw",
        args: [BigInt(campaignId), BigInt(shares * 1e18)],
      })

      toast.success("Withdrawal initiated!")
    } catch (error) {
      console.error("Withdrawal failed:", error)
      toast.error("Failed to withdraw funds")
    }
  }

  const handleHarvestYield = async () => {
    if (!yieldVaultAddress) {
      toast.error("Yield vault not available")
      return
    }

    try {
      await writeContract({
        address: yieldVaultAddress,
        abi: NEWNITY_YIELD_VAULT_ABI,
        functionName: "harvestYield",
        args: [BigInt(campaignId)],
      })

      toast.success("Yield harvested successfully!")
    } catch (error) {
      console.error("Harvest failed:", error)
      toast.error("Failed to harvest yield")
    }
  }

  const getStrategyName = (strategy: YieldStrategy): string => {
    switch (strategy) {
      case YieldStrategy.COMPOUND:
        return "Compound Lending"
      case YieldStrategy.AAVE:
        return "Aave Lending"
      case YieldStrategy.UNISWAP_LP:
        return "Uniswap LP"
      case YieldStrategy.BALANCED:
        return "Balanced Portfolio"
      default:
        return "Unknown"
    }
  }

  const getStrategyRisk = (strategy: YieldStrategy): string => {
    switch (strategy) {
      case YieldStrategy.COMPOUND:
      case YieldStrategy.AAVE:
        return "Low"
      case YieldStrategy.BALANCED:
        return "Medium"
      case YieldStrategy.UNISWAP_LP:
        return "High"
      default:
        return "Unknown"
    }
  }

  const totalDeposited = positions.reduce((sum, pos) => sum + pos.deposited, 0)
  const totalCurrentValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0)
  const totalYieldEarned = totalCurrentValue - totalDeposited

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Deposited</p>
                <p className="text-2xl font-bold">${totalDeposited.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Current Value</p>
                <p className="text-2xl font-bold">${totalCurrentValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Yield Earned</p>
                <p className="text-2xl font-bold text-green-500">+${totalYieldEarned.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Avg APY</p>
                <p className="text-2xl font-bold">{estimatedAPY.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="harvest">Harvest</TabsTrigger>
        </TabsList>

        {/* Deposit Tab */}
        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit to Yield Farming</CardTitle>
              <CardDescription>
                Earn yield on campaign funds through DeFi protocols while maintaining liquidity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available Funds */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Available Funds</span>
                <span className="text-lg font-bold">${availableFunds.toLocaleString()}</span>
              </div>

              {/* Strategy Selection */}
              <div className="space-y-2">
                <Label>Yield Strategy</Label>
                <Select
                  value={selectedStrategy.toString()}
                  onValueChange={(value) => setSelectedStrategy(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={YieldStrategy.COMPOUND.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>Compound Lending</span>
                        <Badge variant="outline" className="ml-2">
                          Low Risk
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={YieldStrategy.AAVE.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>Aave Lending</span>
                        <Badge variant="outline" className="ml-2">
                          Low Risk
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={YieldStrategy.UNISWAP_LP.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>Uniswap LP</span>
                        <Badge variant="destructive" className="ml-2">
                          High Risk
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value={YieldStrategy.BALANCED.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>Balanced Portfolio</span>
                        <Badge variant="secondary" className="ml-2">
                          Medium Risk
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strategy Info */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Strategy:</span> {getStrategyName(selectedStrategy)}
                    </div>
                    <div>
                      <span className="font-medium">Risk Level:</span> {getStrategyRisk(selectedStrategy)}
                    </div>
                    <div>
                      <span className="font-medium">Estimated APY:</span> {estimatedAPY.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-medium">Liquidity:</span> High
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deposit Amount */}
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Deposit Amount (USDC)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  max={availableFunds}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Min: $100</span>
                  <span>Max: ${availableFunds.toLocaleString()}</span>
                </div>
              </div>

              {/* Projected Returns */}
              {depositAmount && (
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Projected Returns (1 Year)
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700 dark:text-green-300">Principal:</span> ${depositAmount}
                      </div>
                      <div>
                        <span className="text-green-700 dark:text-green-300">Yield:</span> $
                        {((Number.parseFloat(depositAmount) * estimatedAPY) / 100).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deposit Button */}
              <Button
                onClick={handleDeposit}
                disabled={
                  !depositAmount ||
                  Number.parseFloat(depositAmount) < 100 ||
                  Number.parseFloat(depositAmount) > availableFunds ||
                  isPending ||
                  isTxLoading
                }
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white glow-primary"
              >
                {(isPending || isTxLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deposit to Yield Farming
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>Monitor and manage your yield farming positions</CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active positions</p>
                  <p className="text-sm text-muted-foreground mt-1">Deposit funds to start earning yield</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{getStrategyName(position.strategy)}</h4>
                          <p className="text-sm text-muted-foreground">
                            APY: {position.apy.toFixed(1)}% • Risk: {getStrategyRisk(position.strategy)}
                          </p>
                        </div>
                        <Badge variant="outline">{position.shares.toFixed(2)} shares</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Deposited</p>
                          <p className="font-medium">${position.deposited.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="font-medium">${position.currentValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Yield</p>
                          <p className="font-medium text-green-500">
                            +${(position.currentValue - position.deposited).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={((position.currentValue - position.deposited) / position.deposited) * 100}
                        className="mb-3"
                      />

                      <Button
                        onClick={() => handleWithdraw(position.shares)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Withdraw Position
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Harvest Tab */}
        <TabsContent value="harvest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Harvest className="h-5 w-5" />
                Yield Harvesting
              </CardTitle>
              <CardDescription>Claim accumulated yield and compound returns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Harvestable Yield */}
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Available to Harvest</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${totalYield ? (Number(totalYield) / 1e6).toFixed(2) : "0.00"}
                </p>
              </div>

              {/* Harvest Options */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleHarvestYield}
                  disabled={!totalYield || Number(totalYield) === 0 || isPending || isTxLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {(isPending || isTxLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Harvest Yield
                </Button>
                <Button variant="outline" disabled>
                  Auto-Compound
                  <Badge variant="secondary" className="ml-2">
                    Soon
                  </Badge>
                </Button>
              </div>

              {/* Harvest History */}
              <div className="space-y-2">
                <h4 className="font-medium">Recent Harvests</h4>
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No harvest history yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
