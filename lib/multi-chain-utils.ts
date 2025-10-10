import { SUPPORTED_CHAINS, CONTRACT_ADDRESSES } from "./wagmi"

// Multi-chain campaign configuration
export interface ChainConfig {
  chainId: number
  name: string
  isTestnet: boolean
  gasToken: string
  usdcAddress: string
  escrowAddress: string
  blockExplorer: string
}

// Get chain configuration
export function getChainConfig(chainId: number): ChainConfig | null {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  if (!chain || !addresses) return null

  return {
    chainId,
    name: chain.name,
    isTestnet: chain.testnet || false,
    gasToken: chain.nativeCurrency.symbol,
    usdcAddress: addresses.MOCK_USDC,
    escrowAddress: addresses.ESCROW_VAULT,
    blockExplorer: chain.blockExplorers?.default.url || "",
  }
}

// Get all supported chain configurations
export function getAllChainConfigs(): ChainConfig[] {
  return SUPPORTED_CHAINS.map((chain) => getChainConfig(chain.id)).filter(Boolean) as ChainConfig[]
}

export function detectBridgeOpportunities(fromChainId: number, toChainId: number) {
  const bridges = [
    {
      name: "Base Bridge",
      url: "https://bridge.base.org",
      supports: [1, 8453, 84532], // Ethereum, Base, Base Sepolia
    },
    {
      name: "Across Protocol",
      url: "https://across.to",
      supports: [1, 8453], // Ethereum, Base
    },
  ]

  return bridges.filter((bridge) => bridge.supports.includes(fromChainId) && bridge.supports.includes(toChainId))
}

export async function estimateGasPrices(): Promise<Record<number, string>> {
  // This would typically fetch from gas price APIs
  // For now, return mock data for Base chains
  return {
    8453: "0.01 gwei", // Base Mainnet
    84532: "0.001 gwei", // Base Sepolia
  }
}

// Chain health monitoring
export interface ChainHealth {
  chainId: number
  isHealthy: boolean
  blockHeight: number
  avgBlockTime: number
  congestion: "low" | "medium" | "high"
}

export async function getChainHealth(chainId: number): Promise<ChainHealth> {
  // Mock implementation - would typically fetch from RPC
  return {
    chainId,
    isHealthy: true,
    blockHeight: Math.floor(Math.random() * 1000000),
    avgBlockTime: 2, // Base L2 block time
    congestion: "low",
  }
}
