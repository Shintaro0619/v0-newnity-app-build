"use client"

import { useState } from "react"
import { usePublicClient, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Button } from "@/components/ui/button"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"

const ESCROW_ADDRESS = "0x6C52550E28152404c03f36089f9f652304C2AB51" as `0x${string}`

export default function VerifyContractPage() {
  const publicClient = usePublicClient()
  const { address, isConnected } = useAccount()
  const { writeContract } = useWriteContract()
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const verifyContract = async () => {
    if (!publicClient || !address) return

    setLoading(true)
    setResult("")

    try {
      console.log("[v0] Starting contract verification...")

      // 1. Get bytecode
      const bytecode = await publicClient.getBytecode({ address: ESCROW_ADDRESS })
      console.log("[v0] Bytecode length:", bytecode?.length)

      // 2. Try to call all view functions
      const results: any = {}

      try {
        const nextId = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "nextCampaignId",
        })
        results.nextCampaignId = nextId.toString()
      } catch (e: any) {
        results.nextCampaignId = `ERROR: ${e.message}`
      }

      try {
        const owner = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "owner",
        })
        results.owner = owner
      } catch (e: any) {
        results.owner = `ERROR: ${e.message}`
      }

      try {
        const usdc = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "usdcToken",
        })
        results.usdcToken = usdc
      } catch (e: any) {
        results.usdcToken = `ERROR: ${e.message}`
      }

      try {
        const platform = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "platformWallet",
        })
        results.platformWallet = platform
      } catch (e: any) {
        results.platformWallet = `ERROR: ${e.message}`
      }

      // 3. Try to read campaign 1
      try {
        const campaign = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "getCampaign",
          args: [1n],
        })
        results.campaign1 = {
          creator: campaign[0],
          goalAmount: campaign[1].toString(),
          totalPledged: campaign[2].toString(),
          deadline: campaign[3].toString(),
          finalized: campaign[4],
          successful: campaign[5],
          platformFeePercent: campaign[6].toString(),
        }
      } catch (e: any) {
        results.campaign1 = `ERROR: ${e.message}`
      }

      // 4. Try to simulate createCampaign
      try {
        const simulation = await publicClient.simulateContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "createCampaign",
          args: [200000000000n, 30n, 500n],
          account: address,
        })
        results.createCampaignSimulation = "SUCCESS"
        results.expectedCampaignId = simulation.result.toString()
      } catch (e: any) {
        results.createCampaignSimulation = `ERROR: ${e.message}`
      }

      console.log("[v0] Verification results:", results)
      setResult(JSON.stringify(results, null, 2))
    } catch (error: any) {
      console.error("[v0] Verification error:", error)
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testCreateCampaign = async (goalAmount: bigint, durationDays: bigint, feePercent: bigint) => {
    if (!publicClient || !address) return

    setLoading(true)
    const testName = `Test: ${goalAmount.toString()}, ${durationDays.toString()}d, ${feePercent.toString()}bp`

    try {
      console.log(`[v0] ${testName} - Starting...`)

      // Step 1: Simulate
      console.log(`[v0] ${testName} - Simulating...`)
      const simulation = await publicClient.simulateContract({
        address: ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalAmount, durationDays, feePercent],
        account: address,
      })
      console.log(`[v0] ${testName} - Simulation SUCCESS, expected ID: ${simulation.result}`)

      // Step 2: Estimate gas
      console.log(`[v0] ${testName} - Estimating gas...`)
      const gasEstimate = await publicClient.estimateContractGas({
        address: ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalAmount, durationDays, feePercent],
        account: address,
      })
      console.log(`[v0] ${testName} - Gas estimate: ${gasEstimate}`)

      // Step 3: Execute with 2x gas buffer
      const gasLimit = gasEstimate * 2n
      console.log(`[v0] ${testName} - Executing with gas limit: ${gasLimit}`)

      const hash = await writeContract({
        address: ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalAmount, durationDays, feePercent],
        gas: gasLimit,
      })

      console.log(`[v0] ${testName} - Transaction sent: ${hash}`)
      setTxHash(hash)
      setResult(`${testName}\nTransaction sent: ${hash}\nWaiting for confirmation...`)

      return { success: true, hash }
    } catch (error: any) {
      console.error(`[v0] ${testName} - ERROR:`, error)
      setResult(`${testName}\nERROR: ${error.message}`)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const runParameterTests = async () => {
    if (!publicClient || !address) return

    setLoading(true)
    setResult("Running parameter tests...\n\n")

    const tests = [
      // Test 1: Small values
      { goal: 1000000n, days: 7n, fee: 100n, name: "Small values" },
      // Test 2: Medium values
      { goal: 100000000n, days: 14n, fee: 250n, name: "Medium values" },
      // Test 3: Original values
      { goal: 200000000000n, days: 30n, fee: 500n, name: "Original values" },
      // Test 4: Large values
      { goal: 1000000000000n, days: 90n, fee: 1000n, name: "Large values" },
    ]

    let results = ""

    for (const test of tests) {
      results += `\n--- ${test.name} ---\n`
      results += `Goal: ${test.goal}, Days: ${test.days}, Fee: ${test.fee}\n`

      try {
        // Simulate only
        const simulation = await publicClient.simulateContract({
          address: ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: "createCampaign",
          args: [test.goal, test.days, test.fee],
          account: address,
        })
        results += `Simulation: SUCCESS (expected ID: ${simulation.result})\n`
      } catch (error: any) {
        results += `Simulation: FAILED - ${error.message}\n`
      }

      setResult(results)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    results += "\n\nAll simulations completed. Choose a test to execute."
    setResult(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Contract Verification</h1>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-2">Connect Wallet</h2>
            <WalletConnectButton />
          </div>

          {isConnected && (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">Verify Contract</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Check if the deployed contract matches our expected ABI and code.
                </p>
                <Button onClick={verifyContract} disabled={loading} className="w-full">
                  {loading ? "Verifying..." : "Verify Contract"}
                </Button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">Test Parameters</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Test createCampaign with different parameter combinations to find what works.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={runParameterTests}
                    disabled={loading}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    {loading ? "Testing..." : "Run Parameter Tests (Simulation Only)"}
                  </Button>
                  <Button
                    onClick={() => testCreateCampaign(1000000n, 7n, 100n)}
                    disabled={loading}
                    className="w-full"
                    variant="secondary"
                  >
                    Execute: Small Values (1M, 7d, 100bp)
                  </Button>
                  <Button
                    onClick={() => testCreateCampaign(200000000000n, 30n, 500n)}
                    disabled={loading}
                    className="w-full"
                  >
                    Execute: Original Values (200B, 30d, 500bp)
                  </Button>
                </div>
              </div>
            </>
          )}

          {txHash && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Transaction Status</h3>
              <p className="text-sm text-gray-300 mb-2">Hash: {txHash}</p>
              <p className="text-sm text-gray-300">
                Status: {isConfirming ? "Confirming..." : isConfirmed ? "Confirmed!" : "Pending"}
              </p>
            </div>
          )}

          {result && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-2">Results</h3>
              <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-black p-4 rounded whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
