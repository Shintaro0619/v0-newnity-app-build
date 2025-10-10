import { encodeFunctionData, parseUnits, type Address } from "viem"

// Advanced EscrowVault ABI with conditional release and automated distribution
export const ADVANCED_ESCROW_ABI = [
  // Basic functions
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    name: "pledge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Milestone-based release
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "milestoneId", type: "uint256" },
      { name: "evidence", type: "string" },
    ],
    name: "submitMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "milestoneId", type: "uint256" },
      { name: "approve", type: "bool" },
    ],
    name: "voteMilestone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Automated distribution
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    name: "distributeFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Conditional release
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "conditions", type: "bytes32[]" },
    ],
    name: "setReleaseConditions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Emergency functions
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    name: "emergencyPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "campaignId", type: "uint256" }],
    name: "refundAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // View functions
  {
    inputs: [{ name: "campaignId", type: "uint256" }],
    name: "getCampaignStatus",
    outputs: [
      { name: "totalPledged", type: "uint256" },
      { name: "totalReleased", type: "uint256" },
      { name: "isPaused", type: "bool" },
      { name: "completedMilestones", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "milestoneId", type: "uint256" },
    ],
    name: "getMilestoneStatus",
    outputs: [
      { name: "isSubmitted", type: "bool" },
      { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" },
      { name: "isApproved", type: "bool" },
      { name: "evidence", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// Governance Token ABI for campaign voting
export const GOVERNANCE_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "description", type: "string" },
    ],
    name: "propose",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Yield Distribution ABI for FanFi features
export const YIELD_DISTRIBUTOR_ABI = [
  {
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "yieldAmount", type: "uint256" },
    ],
    name: "distributeYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "campaignId", type: "uint256" },
    ],
    name: "claimYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "campaignId", type: "uint256" },
    ],
    name: "getPendingYield",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Smart contract interaction utilities
export class AdvancedContractManager {
  // Milestone management
  static encodeMilestoneSubmission(campaignId: number, milestoneId: number, evidence: string) {
    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "submitMilestone",
      args: [BigInt(campaignId), BigInt(milestoneId), evidence],
    })
  }

  static encodeMilestoneVote(campaignId: number, milestoneId: number, approve: boolean) {
    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "voteMilestone",
      args: [BigInt(campaignId), BigInt(milestoneId), approve],
    })
  }

  // Automated distribution
  static encodeDistribution(campaignId: number, recipients: Address[], amounts: string[]) {
    const amountsBigInt = amounts.map((amount) => parseUnits(amount, 6))
    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "distributeFunds",
      args: [BigInt(campaignId), recipients, amountsBigInt],
    })
  }

  // Conditional release
  static encodeReleaseConditions(campaignId: number, conditions: string[]) {
    // Convert conditions to bytes32 hashes
    const conditionHashes = conditions.map((condition) => {
      // Simple hash - in production, use proper keccak256
      return `0x${condition.padEnd(64, "0")}` as `0x${string}`
    })

    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "setReleaseConditions",
      args: [BigInt(campaignId), conditionHashes],
    })
  }

  // Emergency functions
  static encodeEmergencyPause(campaignId: number, reason: string) {
    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "emergencyPause",
      args: [BigInt(campaignId), reason],
    })
  }

  static encodeRefundAll(campaignId: number) {
    return encodeFunctionData({
      abi: ADVANCED_ESCROW_ABI,
      functionName: "refundAll",
      args: [BigInt(campaignId)],
    })
  }

  // Governance functions
  static encodeGovernanceVote(proposalId: number, support: 0 | 1 | 2) {
    return encodeFunctionData({
      abi: GOVERNANCE_TOKEN_ABI,
      functionName: "castVote",
      args: [BigInt(proposalId), support],
    })
  }

  // Yield distribution
  static encodeYieldClaim(userAddress: Address, campaignId: number) {
    return encodeFunctionData({
      abi: YIELD_DISTRIBUTOR_ABI,
      functionName: "claimYield",
      args: [userAddress, BigInt(campaignId)],
    })
  }
}

// Contract deployment configurations
export const CONTRACT_DEPLOYMENT_CONFIG = {
  // Advanced Escrow Vault
  advancedEscrow: {
    name: "AdvancedEscrowVault",
    constructor: ["address _usdcToken", "address _governance", "uint256 _votingPeriod"],
    features: [
      "Milestone-based fund release",
      "Community voting on milestones",
      "Automated distribution",
      "Conditional release mechanisms",
      "Emergency pause functionality",
    ],
  },
  // Governance Token
  governanceToken: {
    name: "NewnityGovernanceToken",
    constructor: ["string _name", "string _symbol", "uint256 _initialSupply"],
    features: ["Voting power for milestone approval", "Proposal creation rights", "Yield distribution governance"],
  },
  // Yield Distributor
  yieldDistributor: {
    name: "YieldDistributor",
    constructor: ["address _escrowVault", "address _governanceToken"],
    features: ["Automated yield distribution", "Proportional reward allocation", "Claimable yield tracking"],
  },
}

// Risk management utilities
export class RiskManager {
  // Calculate risk score for campaign
  static calculateRiskScore(campaign: {
    goalAmount: number
    duration: number
    creatorReputation: number
    milestoneCount: number
  }): number {
    let riskScore = 0

    // Amount risk (higher amounts = higher risk)
    if (campaign.goalAmount > 1000000) riskScore += 30
    else if (campaign.goalAmount > 100000) riskScore += 20
    else if (campaign.goalAmount > 10000) riskScore += 10

    // Duration risk (longer campaigns = higher risk)
    if (campaign.duration > 365) riskScore += 25
    else if (campaign.duration > 180) riskScore += 15
    else if (campaign.duration > 90) riskScore += 5

    // Creator reputation (lower reputation = higher risk)
    if (campaign.creatorReputation < 50) riskScore += 40
    else if (campaign.creatorReputation < 100) riskScore += 20
    else if (campaign.creatorReputation < 200) riskScore += 10

    // Milestone structure (fewer milestones = higher risk)
    if (campaign.milestoneCount < 2) riskScore += 30
    else if (campaign.milestoneCount < 4) riskScore += 15

    return Math.min(riskScore, 100) // Cap at 100
  }

  // Get recommended release schedule
  static getRecommendedReleaseSchedule(riskScore: number, totalAmount: number) {
    if (riskScore > 70) {
      // High risk: 10% upfront, rest in small increments
      return {
        upfront: totalAmount * 0.1,
        milestoneReleases: Array(8).fill(totalAmount * 0.1125), // 8 releases of 11.25%
        schedule: "Conservative - High risk detected",
      }
    } else if (riskScore > 40) {
      // Medium risk: 25% upfront, rest in moderate increments
      return {
        upfront: totalAmount * 0.25,
        milestoneReleases: Array(5).fill(totalAmount * 0.15), // 5 releases of 15%
        schedule: "Moderate - Medium risk",
      }
    } else {
      // Low risk: 40% upfront, rest in larger increments
      return {
        upfront: totalAmount * 0.4,
        milestoneReleases: Array(3).fill(totalAmount * 0.2), // 3 releases of 20%
        schedule: "Aggressive - Low risk",
      }
    }
  }
}
