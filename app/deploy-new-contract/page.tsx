"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink } from "lucide-react"

const CAMPAIGN_ESCROW_BYTECODE = "0x..." // This would be the compiled bytecode

export default function DeployNewContractPage() {
  const { address, isConnected } = useAccount()
  const [deployedAddress, setDeployedAddress] = useState<string>("")
  const [error, setError] = useState<string>("")

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleDeploy = async () => {
    try {
      setError("")

      // For now, show instructions to deploy via Remix
      setError("Please use Remix IDE to deploy the contract. See instructions below.")
    } catch (err: any) {
      console.error("[v0] Deployment error:", err)
      setError(err.message || "Deployment failed")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-4">Deploy New Contract</h1>
        <p className="text-gray-400 mb-8">Deploy a fresh CampaignEscrow contract to resolve the current issues.</p>

        {/* Problem Summary Section */}
        <Card className="bg-red-900/20 border-red-900 p-6 mb-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Current Problem</h2>
          <div className="space-y-2 text-gray-300">
            <p>
              既存のコントラクト（
              <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">
                0xBb2Ad789230E5b0a381e76dC3F3D54ec3BfAe271
              </code>
              ）では、キャンペーン2の作成が失敗し続けています。
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
              <li>シミュレーションは成功するが、実際のトランザクションが失敗</li>
              <li>ガス見積もりを増やしても失敗</li>
              <li>異なるパラメータでも失敗</li>
              <li>
                Owner（<code className="bg-gray-800 px-1 rounded text-xs">0x37C3...</code>）と送信者（
                <code className="bg-gray-800 px-1 rounded text-xs">0x7724...</code>）が異なる
              </li>
            </ul>
            <p className="font-bold text-red-400 mt-4">解決策: 新しいコントラクトをデプロイする必要があります</p>
          </div>
        </Card>

        <div className="space-y-6">
          {/* Connect Wallet */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Step 1: Connect Wallet</h2>
            <WalletConnectButton />
            {isConnected && address && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-900 rounded">
                <p className="text-sm text-green-400">Connected: {address}</p>
                <p className="text-xs text-gray-400 mt-1">このアドレスが新しいコントラクトのownerになります</p>
              </div>
            )}
          </Card>

          {/* Deployment Instructions */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Step 2: Deploy via Remix IDE</h2>

            <div className="space-y-4 text-gray-300">
              <p>以下の手順でコントラクトをデプロイしてください：</p>

              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>
                  <a
                    href="https://remix.ethereum.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Remix IDE <ExternalLink className="w-4 h-4" />
                  </a>
                  を開く
                </li>
                <li>
                  新しいファイルを作成: <code className="bg-gray-800 px-2 py-1 rounded">CampaignEscrow.sol</code>
                </li>
                <li>
                  <code className="bg-gray-800 px-2 py-1 rounded">DEPLOY_THIS_CONTRACT.sol</code>
                  の内容をコピー
                </li>
                <li>Solidity Compilerタブで0.8.20を選択してコンパイル</li>
                <li>Deploy & Run Transactionsタブを開く</li>
                <li>Environment: "Injected Provider - MetaMask"を選択</li>
                <li>MetaMaskでBase Sepolia（Chain ID: 84532）に接続</li>
                <li>以下のConstructor parametersを入力：</li>
              </ol>

              <div className="bg-gray-800 p-4 rounded-lg space-y-3 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">_usdcToken (Mock USDC address):</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <code className="text-blue-400 text-sm break-all">0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB</code>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">_platformWallet (あなたのウォレット):</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(address || "0x77247CC270768611eb2fBc7759a7b34b9FB045Cd")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <code className="text-blue-400 text-sm break-all">
                    {address || "0x77247CC270768611eb2fBc7759a7b34b9FB045Cd"}
                  </code>
                </div>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-900 mt-4">
                <AlertDescription className="text-yellow-400">
                  重要: _platformWalletには、接続中のウォレットアドレス（{address || "あなたのアドレス"}
                  ）を使用してください。これにより、あなたがコントラクトのownerになります。
                </AlertDescription>
              </Alert>

              <ol className="list-decimal list-inside space-y-3 ml-4" start={9}>
                <li>"Deploy"ボタンをクリック</li>
                <li>MetaMaskでトランザクションを承認</li>
                <li>デプロイ完了後、コントラクトアドレスをコピー</li>
              </ol>
            </div>
          </Card>

          {/* Update Environment Variable */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Step 3: Update Environment Variable</h2>

            <div className="space-y-4 text-gray-300">
              <p>デプロイ後、コントラクトアドレスを更新してください：</p>

              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>Remixからデプロイされたコントラクトアドレスをコピー</li>
                <li>Vercel Dashboard → Settings → Environment Variablesを開く</li>
                <li>
                  <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA</code>
                  を新しいアドレスに更新
                </li>
                <li>変更を保存してアプリケーションを再デプロイ</li>
              </ol>

              <Alert className="bg-blue-900/20 border-blue-900 mt-4">
                <AlertDescription className="text-blue-400">
                  環境変数を更新した後、ブラウザをハードリフレッシュ（Cmd+Shift+R / Ctrl+Shift+R）してください。
                </AlertDescription>
              </Alert>
            </div>
          </Card>

          {/* Verification Step */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Step 4: Verify New Contract</h2>

            <div className="space-y-4 text-gray-300">
              <p>新しいコントラクトがデプロイされたら、以下を確認してください：</p>

              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>
                  <a href="/test/verify-contract" className="text-blue-400 hover:underline">
                    /test/verify-contract
                  </a>
                  で「Verify Contract」を実行
                </li>
                <li>nextCampaignIdが1であることを確認</li>
                <li>ownerがあなたのアドレスであることを確認</li>
                <li>createCampaignシミュレーションが成功することを確認</li>
              </ol>

              <Button onClick={() => (window.location.href = "/test/verify-contract")} className="w-full mt-4">
                Go to Verification Page
              </Button>
            </div>
          </Card>

          {/* Updated Alternative Section */}
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Troubleshooting</h2>

            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-bold text-white mb-2">デプロイが失敗する場合：</h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                  <li>ウォレットに十分なETH（ガス代）があることを確認</li>
                  <li>Base Sepoliaネットワークに接続されていることを確認</li>
                  <li>Constructor parametersが正しいことを確認</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white mb-2">環境変数の更新後もエラーが出る場合：</h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                  <li>ブラウザのキャッシュをクリア</li>
                  <li>Vercelで再デプロイ</li>
                  <li>ページをハードリフレッシュ（Cmd+Shift+R / Ctrl+Shift+R）</li>
                </ul>
              </div>

              <Alert className="bg-green-900/20 border-green-900 mt-4">
                <AlertDescription className="text-green-400">
                  新しいコントラクトでは、あなたがownerになるため、すべての機能が正常に動作するはずです。
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
