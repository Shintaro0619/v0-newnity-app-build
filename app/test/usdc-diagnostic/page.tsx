"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { baseSepolia } from "wagmi/chains"
import { parseUnits, formatUnits } from "viem"

const MOCK_USDC_ADDRESS = "0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB" as `0x${string}`
const ESCROW_ADDRESS = "0x6C52550E28152404c03f36089f9f652304C2AB51" as `0x${string}`

const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

const ESCROW_ABI = [
  {
    inputs: [],
    name: "usdcToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformWallet",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextCampaignId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_goalAmount", type: "uint256" },
      { name: "_durationDays", type: "uint256" },
      { name: "_platformFeePercent", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export default function USDCDiagnosticPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Check if USDC contract exists
  const { data: usdcName, error: nameError } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "name",
    chainId: baseSepolia.id,
  })

  const { data: usdcSymbol } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "symbol",
    chainId: baseSepolia.id,
  })

  const { data: usdcDecimals } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: baseSepolia.id,
  })

  const { data: totalSupply } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "totalSupply",
    chainId: baseSepolia.id,
  })

  const { data: userBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  })

  // Check Escrow contract
  const { data: escrowUsdcAddress } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "usdcToken",
    chainId: baseSepolia.id,
  })

  const { data: platformWallet } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "platformWallet",
    chainId: baseSepolia.id,
  })

  const { data: nextCampaignId } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "nextCampaignId",
    chainId: baseSepolia.id,
  })

  const { writeContract, data: txHash } = useWriteContract()
  const { isLoading: isTxPending, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    const diag = {
      usdc: {
        contractExists: !nameError,
        name: usdcName,
        symbol: usdcSymbol,
        decimals: usdcDecimals,
        totalSupply: totalSupply?.toString(),
        userBalance: userBalance?.toString(),
        error: nameError?.message,
      },
      escrow: {
        address: ESCROW_ADDRESS,
        usdcAddress: escrowUsdcAddress,
        platformWallet: platformWallet,
        nextCampaignId: nextCampaignId?.toString(),
        usdcMatches: escrowUsdcAddress?.toLowerCase() === MOCK_USDC_ADDRESS.toLowerCase(),
      },
    }
    setDiagnostics(diag)
    console.log("[v0] Full Diagnostics:", diag)
  }, [
    usdcName,
    usdcSymbol,
    usdcDecimals,
    totalSupply,
    userBalance,
    nameError,
    escrowUsdcAddress,
    platformWallet,
    nextCampaignId,
  ])

  const runComprehensiveTests = async () => {
    if (!address || !publicClient) return

    setIsRunningTests(true)
    const results: string[] = []

    try {
      // Test 1: Check if USDC contract has code
      results.push("🔍 Test 1: Checking if USDC contract has bytecode...")
      const usdcCode = await publicClient.getBytecode({ address: MOCK_USDC_ADDRESS })
      if (usdcCode && usdcCode !== "0x") {
        results.push("✅ USDC contract has bytecode (exists on-chain)")
      } else {
        results.push("❌ USDC contract has NO bytecode (does not exist)")
        setTestResults(results)
        setIsRunningTests(false)
        return
      }

      // Test 2: Check if Escrow contract has code
      results.push("\n🔍 Test 2: Checking if Escrow contract has bytecode...")
      const escrowCode = await publicClient.getBytecode({ address: ESCROW_ADDRESS })
      if (escrowCode && escrowCode !== "0x") {
        results.push("✅ Escrow contract has bytecode (exists on-chain)")
      } else {
        results.push("❌ Escrow contract has NO bytecode (does not exist)")
        setTestResults(results)
        setIsRunningTests(false)
        return
      }

      // Test 3: Verify USDC address match
      results.push("\n🔍 Test 3: Verifying USDC address in Escrow contract...")
      if (diagnostics.escrow.usdcMatches) {
        results.push(`✅ USDC addresses match: ${escrowUsdcAddress}`)
      } else {
        results.push(`❌ USDC address MISMATCH!`)
        results.push(`   Expected: ${MOCK_USDC_ADDRESS}`)
        results.push(`   Escrow has: ${escrowUsdcAddress}`)
      }

      // Test 4: Try to mint USDC
      results.push("\n🔍 Test 4: Testing USDC mint function...")
      try {
        const mintHash = await writeContract({
          address: MOCK_USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [parseUnits("100", 6)],
          gas: 100000n,
        })
        results.push(`✅ Mint transaction sent: ${mintHash}`)
        results.push("   Waiting for confirmation...")
      } catch (error: any) {
        results.push(`❌ Mint failed: ${error.message}`)
      }

      // Test 5: Simulate createCampaign
      results.push("\n🔍 Test 5: Simulating createCampaign transaction...")
      try {
        const { request } = await publicClient.simulateContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "createCampaign",
          args: [parseUnits("1000", 6), 30n, 500n],
          account: address,
        })
        results.push("✅ createCampaign simulation PASSED")
        results.push(`   This means the transaction SHOULD work`)
      } catch (error: any) {
        results.push(`❌ createCampaign simulation FAILED: ${error.message}`)
        if (error.message.includes("revert")) {
          results.push(`   Contract reverted. This is the root cause!`)
        }
      }

      setTestResults(results)
    } catch (error: any) {
      results.push(`\n❌ Test suite error: ${error.message}`)
      setTestResults(results)
    } finally {
      setIsRunningTests(false)
    }
  }

  const handleMintUSDC = async () => {
    if (!address) return
    try {
      await writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [parseUnits("1000", 6)],
        gas: 100000n,
      })
    } catch (error: any) {
      console.error("[v0] Mint error:", error)
    }
  }

  const handleTestCreateCampaign = async () => {
    if (!address) return
    try {
      await writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "createCampaign",
        args: [parseUnits("1000", 6), 30n, 500n],
        gas: 500000n,
      })
    } catch (error: any) {
      console.error("[v0] createCampaign error:", error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Complete Contract Diagnostic Tool</h1>

      {/* USDC Contract Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Mock USDC Contract</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Address:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{MOCK_USDC_ADDRESS}</code>
          </p>
          <p>
            <strong>Exists:</strong>{" "}
            <span
              className={
                diagnostics.usdc?.contractExists ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
              }
            >
              {diagnostics.usdc?.contractExists ? "✅ Yes" : "❌ No"}
            </span>
          </p>
          {diagnostics.usdc?.contractExists ? (
            <>
              <p>
                <strong>Name:</strong> {diagnostics.usdc?.name}
              </p>
              <p>
                <strong>Symbol:</strong> {diagnostics.usdc?.symbol}
              </p>
              <p>
                <strong>Decimals:</strong> {diagnostics.usdc?.decimals}
              </p>
              <p>
                <strong>Total Supply:</strong>{" "}
                {diagnostics.usdc?.totalSupply ? formatUnits(BigInt(diagnostics.usdc.totalSupply), 6) : "0"} USDC
              </p>
              <p>
                <strong>Your Balance:</strong>{" "}
                {diagnostics.usdc?.userBalance ? formatUnits(BigInt(diagnostics.usdc.userBalance), 6) : "0"} USDC
              </p>
            </>
          ) : (
            <p className="text-red-600 text-xs mt-2">
              <strong>Error:</strong> {diagnostics.usdc?.error}
            </p>
          )}
        </div>
      </Card>

      {/* Escrow Contract Status */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Escrow Contract</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Address:</strong> <code className="bg-gray-800 px-2 py-1 rounded">{ESCROW_ADDRESS}</code>
          </p>
          <p>
            <strong>USDC Address:</strong>{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-xs">{diagnostics.escrow?.usdcAddress}</code>
          </p>
          <p>
            <strong>USDC Match:</strong>{" "}
            <span
              className={
                diagnostics.escrow?.usdcMatches ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
              }
            >
              {diagnostics.escrow?.usdcMatches ? "✅ Correct" : "❌ Mismatch!"}
            </span>
          </p>
          <p>
            <strong>Platform Wallet:</strong>{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-xs">{diagnostics.escrow?.platformWallet}</code>
          </p>
          <p>
            <strong>Next Campaign ID:</strong> {diagnostics.escrow?.nextCampaignId}
          </p>
        </div>
      </Card>

      {/* Test Actions */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={handleMintUSDC} disabled={!address || isTxPending || !diagnostics.usdc?.contractExists}>
            {isTxPending ? "Minting..." : "Mint 1000 USDC"}
          </Button>
          <Button onClick={handleTestCreateCampaign} disabled={!address || isTxPending} variant="secondary">
            {isTxPending ? "Creating..." : "Test createCampaign"}
          </Button>
          <Button onClick={runComprehensiveTests} disabled={!address || isRunningTests} variant="outline">
            {isRunningTests ? "Running Tests..." : "Run Full Diagnostic"}
          </Button>
        </div>
        {txSuccess && <p className="text-green-600 mt-4 font-semibold">✅ Transaction successful!</p>}
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6 mb-6 bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-black text-green-400 p-4 rounded overflow-x-auto">
            {testResults.join("\n")}
          </pre>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">診断結果と推奨事項</h2>
        {!diagnostics.usdc?.contractExists ? (
          <div className="bg-red-950/30 p-4 rounded">
            <p className="font-semibold text-red-400 mb-2">❌ Mock USDCコントラクトが存在しません</p>
            <p className="text-sm mb-2">新しいMock USDCをデプロイする必要があります。</p>
          </div>
        ) : !diagnostics.escrow?.usdcMatches ? (
          <div className="bg-yellow-950/30 p-4 rounded">
            <p className="font-semibold text-yellow-400 mb-2">⚠️ USDCアドレスが一致しません</p>
            <p className="text-sm mb-2">
              Escrowコントラクトは別のUSDCアドレス（{diagnostics.escrow?.usdcAddress}）を使用しています。
            </p>
            <p className="text-sm">正しいUSDCアドレスで新しいEscrowコントラクトをデプロイする必要があります。</p>
          </div>
        ) : (
          <div className="bg-green-950/30 p-4 rounded">
            <p className="font-semibold text-green-400 mb-2">✅ 両方のコントラクトが正しく設定されています</p>
            <p className="text-sm mb-2">「Run Full Diagnostic」ボタンを押して、詳細なテストを実行してください。</p>
          </div>
        )}
      </Card>
    </div>
  )
}
