export const CONTRACT_ADDRESSES = {
  baseSepolia: {
    campaignEscrow: (process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA ||
      "0x6C52550E28152404c03f36089f9f652304C2AB51") as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA ||
      "0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB") as `0x${string}`,
  },
  base: {
    campaignEscrow: (process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_BASE || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`,
  },
} as const

export const CAMPAIGN_ESCROW_ADDRESS = CONTRACT_ADDRESSES.baseSepolia.campaignEscrow
export const USDC_ADDRESS = CONTRACT_ADDRESSES.baseSepolia.usdc

export function getContractAddress(chainId: number, contract: "campaignEscrow" | "usdc"): `0x${string}` {
  if (chainId === 84532) {
    // Base Sepolia
    return CONTRACT_ADDRESSES.baseSepolia[contract]
  } else if (chainId === 8453) {
    // Base Mainnet
    return CONTRACT_ADDRESSES.base[contract]
  }
  throw new Error(`Unsupported chain ID: ${chainId}`)
}

export function getUSDCAddress(chainId?: number): `0x${string}` {
  const targetChainId = chainId || 84532 // Default to Base Sepolia
  return getContractAddress(targetChainId, "usdc")
}
