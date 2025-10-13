"use client"

import { useState } from "react"
import { useAccount, useReadContract, usePublicClient } from "wagmi"
import { TestUSDCFaucet } from "@/components/test-usdc-faucet"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { CONTRACT_ADDRESSES } from "@/lib/contracts/contract-addresses"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { baseSepolia } from "wagmi/chains"
import { parseUnits } from "viem"

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

export default function TestPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

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

  const { data: escrowUsdcAddress } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "usdcToken",
    chainId: baseSepolia.id,
  })

  const { data: nextCampaignId } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "nextCampaignId",
    chainId: baseSepolia.id,
  })

  const runComprehensiveTests = async () => {
    if (!address || !publicClient) {
      alert("ウォレットを接続してください")
      return
    }

    setIsRunningTests(true)
    const results: string[] = []

    try {
      results.push("=== Mock USDC & Escrow 完全診断 ===\n")

      // Test 1: Check if USDC contract has code
      results.push("🔍 Test 1: Mock USDCコントラクトのバイトコード確認...")
      const usdcCode = await publicClient.getBytecode({ address: MOCK_USDC_ADDRESS })
      if (usdcCode && usdcCode !== "0x") {
        results.push("✅ Mock USDCコントラクトは存在します")
        results.push(`   バイトコードサイズ: ${usdcCode.length} bytes`)
      } else {
        results.push("❌ Mock USDCコントラクトが存在しません！")
        results.push("   → 新しいMock USDCをデプロイする必要があります")
        setTestResults(results)
        setIsRunningTests(false)
        return
      }

      // Test 2: Check if Escrow contract has code
      results.push("\n🔍 Test 2: Escrowコントラクトのバイトコード確認...")
      const escrowCode = await publicClient.getBytecode({ address: ESCROW_ADDRESS })
      if (escrowCode && escrowCode !== "0x") {
        results.push("✅ Escrowコントラクトは存在します")
        results.push(`   バイトコードサイズ: ${escrowCode.length} bytes`)
      } else {
        results.push("❌ Escrowコントラクトが存在しません！")
        setTestResults(results)
        setIsRunningTests(false)
        return
      }

      // Test 3: Verify USDC address match
      results.push("\n🔍 Test 3: USDCアドレスの一致確認...")
      const usdcMatches = escrowUsdcAddress?.toLowerCase() === MOCK_USDC_ADDRESS.toLowerCase()
      if (usdcMatches) {
        results.push(`✅ USDCアドレスが一致しています`)
        results.push(`   ${escrowUsdcAddress}`)
      } else {
        results.push(`❌ USDCアドレスが一致しません！`)
        results.push(`   期待値: ${MOCK_USDC_ADDRESS}`)
        results.push(`   実際値: ${escrowUsdcAddress}`)
        results.push("   → 正しいUSDCアドレスで新しいEscrowをデプロイする必要があります")
      }

      // Test 4: Check USDC contract functions
      results.push("\n🔍 Test 4: Mock USDC ERC20機能確認...")
      if (usdcName && usdcSymbol) {
        results.push(`✅ ERC20機能が正常に動作しています`)
        results.push(`   Name: ${usdcName}`)
        results.push(`   Symbol: ${usdcSymbol}`)
      } else {
        results.push(`❌ ERC20機能の読み取りに失敗しました`)
        results.push(`   エラー: ${nameError?.message}`)
      }

      // Test 5: Simulate createCampaign
      results.push("\n🔍 Test 5: createCampaignトランザクションのシミュレーション...")
      try {
        const simulation = await publicClient.simulateContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: "createCampaign",
          args: [parseUnits("1000", 6), 30n, 500n],
          account: address,
          gas: 500000n,
        })
        results.push("✅ createCampaignシミュレーション成功！")
        results.push(`   予想される戻り値: ${simulation.result}`)
        results.push("   → トランザクションは成功するはずです")
      } catch (error: any) {
        results.push(`❌ createCampaignシミュレーション失敗`)
        results.push(`   エラー: ${error.message}`)

        if (error.message.includes("revert")) {
          results.push("\n⚠️ コントラクトがrevertしています。これが根本原因です！")
          results.push("   考えられる原因:")
          results.push("   1. コントラクトのrequire文が失敗している")
          results.push("   2. ガス不足")
          results.push("   3. コントラクトのバグ")
        }
      }

      // Test 6: Check next campaign ID
      results.push("\n🔍 Test 6: 次のキャンペーンID確認...")
      results.push(`   Next Campaign ID: ${nextCampaignId?.toString() || "読み取り失敗"}`)

      results.push("\n=== 診断完了 ===")
      setTestResults(results)
    } catch (error: any) {
      results.push(`\n❌ 診断エラー: ${error.message}`)
      setTestResults(results)
    } finally {
      setIsRunningTests(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-white mb-8">Test Tools</h1>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Connect Wallet</h2>
            <WalletConnectButton />
          </div>

          <TestUSDCFaucet />

          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">完全診断ツール</h2>
            <p className="text-gray-400 text-sm mb-4">
              Mock USDCとEscrowコントラクトの状態を完全にチェックし、createCampaignが失敗する原因を特定します。
            </p>

            <Button
              onClick={runComprehensiveTests}
              disabled={!address || isRunningTests}
              className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
            >
              {isRunningTests ? "診断実行中..." : "🔍 Run Full Diagnostic"}
            </Button>

            {testResults.length > 0 && (
              <div className="mt-4 bg-black rounded-lg p-4 border border-gray-700">
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap overflow-x-auto">
                  {testResults.join("\n")}
                </pre>
              </div>
            )}
          </Card>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-2">Contract Addresses</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Campaign Escrow:</span>
                <code className="ml-2 text-blue-400">{CONTRACT_ADDRESSES.baseSepolia.campaignEscrow}</code>
              </div>
              <div>
                <span className="text-gray-400">Mock USDC (Base Sepolia):</span>
                <code className="ml-2 text-green-400">{CONTRACT_ADDRESSES.baseSepolia.usdc}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
