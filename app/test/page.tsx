import { TestUSDCFaucet } from "@/components/test-usdc-faucet"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { CONTRACT_ADDRESSES } from "@/lib/contracts/contract-addresses"

export default function TestPage() {
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
