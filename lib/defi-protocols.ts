import { encodeFunctionData, parseUnits, type Address } from "viem"

// Uniswap V3 Pool ABI (simplified)
export const UNISWAP_V3_POOL_ABI = [
  {
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount0Desired", type: "uint256" },
      { name: "amount1Desired", type: "uint256" },
      { name: "amount0Min", type: "uint256" },
      { name: "amount1Min", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    name: "mint",
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "burn",
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Compound V3 ABI (simplified)
export const COMPOUND_V3_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "account", type: "address" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Aave V3 Pool ABI (simplified)
export const AAVE_V3_POOL_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Newnity Yield Vault ABI
export const NEWNITY_YIELD_VAULT_ABI = [
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "strategy", type: "uint8" }, // 0: Compound, 1: Aave, 2: Uniswap LP
    ],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "shares", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "campaignId", type: "uint256" }],
    name: "harvestYield",
    outputs: [{ name: "yieldAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getUserShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "campaignId", type: "uint256" }],
    name: "getTotalYield",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// DeFi Protocol Addresses (Base network)
export const DEFI_PROTOCOL_ADDRESSES = {
  // Base mainnet addresses
  8453: {
    COMPOUND_V3: "0xb125E6687d4313864e53df431d5425969c15Eb2F" as Address,
    AAVE_V3_POOL: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as Address,
    UNISWAP_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as Address,
    UNISWAP_V3_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481" as Address,
    NEWNITY_YIELD_VAULT: "0x0000000000000000000000000000000000000000" as Address, // To be deployed
  },
  // Base Sepolia testnet addresses
  84532: {
    COMPOUND_V3: "0x0000000000000000000000000000000000000000" as Address, // Mock for testnet
    AAVE_V3_POOL: "0x0000000000000000000000000000000000000000" as Address, // Mock for testnet
    UNISWAP_V3_FACTORY: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24" as Address,
    UNISWAP_V3_ROUTER: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" as Address,
    NEWNITY_YIELD_VAULT: "0x0000000000000000000000000000000000000000" as Address, // To be deployed
  },
} as const

// Yield Strategy Types
export enum YieldStrategy {
  COMPOUND = 0,
  AAVE = 1,
  UNISWAP_LP = 2,
  BALANCED = 3,
}

// DeFi Integration Manager
export class DeFiManager {
  // Get protocol address for chain
  static getProtocolAddress(chainId: number, protocol: keyof (typeof DEFI_PROTOCOL_ADDRESSES)[8453]): Address {
    const addresses = DEFI_PROTOCOL_ADDRESSES[chainId as keyof typeof DEFI_PROTOCOL_ADDRESSES]
    if (!addresses) {
      throw new Error(`Unsupported chain ID for DeFi: ${chainId}`)
    }
    return addresses[protocol]
  }

  // Encode deposit to yield vault
  static encodeYieldDeposit(campaignId: number, amount: string, strategy: YieldStrategy) {
    return encodeFunctionData({
      abi: NEWNITY_YIELD_VAULT_ABI,
      functionName: "deposit",
      args: [BigInt(campaignId), parseUnits(amount, 6), strategy],
    })
  }

  // Encode withdrawal from yield vault
  static encodeYieldWithdraw(campaignId: number, shares: string) {
    return encodeFunctionData({
      abi: NEWNITY_YIELD_VAULT_ABI,
      functionName: "withdraw",
      args: [BigInt(campaignId), parseUnits(shares, 18)],
    })
  }

  // Encode yield harvest
  static encodeYieldHarvest(campaignId: number) {
    return encodeFunctionData({
      abi: NEWNITY_YIELD_VAULT_ABI,
      functionName: "harvestYield",
      args: [BigInt(campaignId)],
    })
  }

  // Calculate optimal yield strategy based on market conditions
  static calculateOptimalStrategy(
    amount: number,
    riskTolerance: "low" | "medium" | "high",
    duration: number,
  ): YieldStrategy {
    // Simple strategy selection logic
    if (riskTolerance === "low") {
      return YieldStrategy.COMPOUND // Stable lending
    } else if (riskTolerance === "high" && amount > 10000) {
      return YieldStrategy.UNISWAP_LP // Higher yield but impermanent loss risk
    } else if (duration > 180) {
      return YieldStrategy.AAVE // Good for longer terms
    } else {
      return YieldStrategy.BALANCED // Diversified approach
    }
  }

  // Estimate APY for different strategies
  static async estimateAPY(strategy: YieldStrategy, amount: number): Promise<number> {
    // Mock APY calculation - in production, fetch from protocol APIs
    const baseAPYs = {
      [YieldStrategy.COMPOUND]: 4.5,
      [YieldStrategy.AAVE]: 3.8,
      [YieldStrategy.UNISWAP_LP]: 12.5,
      [YieldStrategy.BALANCED]: 6.2,
    }

    // Add bonus for larger amounts
    const sizeBonus = amount > 100000 ? 0.5 : amount > 10000 ? 0.2 : 0
    return baseAPYs[strategy] + sizeBonus
  }
}

// Liquidity Pool Management
export class LiquidityPoolManager {
  // Calculate optimal liquidity provision
  static calculateLPPosition(
    token0Amount: number,
    token1Amount: number,
    currentPrice: number,
    priceRange: { min: number; max: number },
  ) {
    // Simplified LP calculation
    const midPrice = (priceRange.min + priceRange.max) / 2
    const priceRatio = currentPrice / midPrice

    return {
      optimalToken0: token0Amount * priceRatio,
      optimalToken1: token1Amount / priceRatio,
      expectedFees: (token0Amount + token1Amount) * 0.003, // 0.3% fee tier
      impermanentLossRisk: Math.abs(priceRatio - 1) * 0.1,
    }
  }

  // Encode LP position creation
  static encodeLPMint(recipient: Address, amount0: string, amount1: string, slippage = 0.5) {
    const amount0Desired = parseUnits(amount0, 6)
    const amount1Desired = parseUnits(amount1, 18)
    const amount0Min = (amount0Desired * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const amount1Min = (amount1Desired * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800) // 30 minutes

    return encodeFunctionData({
      abi: UNISWAP_V3_POOL_ABI,
      functionName: "mint",
      args: [recipient, amount0Desired, amount1Desired, amount0Min, amount1Min, deadline],
    })
  }
}

// Staking Rewards System
export const STAKING_REWARDS_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "earned",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export class StakingManager {
  // Calculate staking rewards
  static calculateStakingRewards(
    stakedAmount: number,
    stakingDuration: number, // in days
    apy: number,
  ): number {
    const dailyRate = apy / 365 / 100
    return stakedAmount * dailyRate * stakingDuration
  }

  // Encode staking transaction
  static encodeStake(amount: string) {
    return encodeFunctionData({
      abi: STAKING_REWARDS_ABI,
      functionName: "stake",
      args: [parseUnits(amount, 18)],
    })
  }

  // Encode unstaking transaction
  static encodeUnstake(amount: string) {
    return encodeFunctionData({
      abi: STAKING_REWARDS_ABI,
      functionName: "unstake",
      args: [parseUnits(amount, 18)],
    })
  }
}
