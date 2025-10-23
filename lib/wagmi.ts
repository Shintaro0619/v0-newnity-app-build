import { http, createConfig } from "wagmi"
import { baseSepolia, base } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"

if (typeof window !== "undefined") {
  if (typeof (window as any).process === "undefined") {
    ;(window as any).process = {
      env: {},
      version: "v18.0.0",
      versions: {},
      platform: "browser",
      nextTick: (callback: Function, ...args: any[]) => {
        setTimeout(() => callback(...args), 0)
      },
      emitWarning: function emitWarning(...args: any[]) {
        return undefined
      },
    }
  }
}

// Custom Base Sepolia configuration
const baseSepoliaCustom = {
  ...baseSepolia,
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
    public: {
      http: ["https://sepolia.base.org"],
    },
  },
}

// Base mainnet configuration
const baseMainnetCustom = {
  ...base,
  rpcUrls: {
    default: {
      http: ["https://mainnet.base.org"],
    },
    public: {
      http: ["https://mainnet.base.org"],
    },
  },
}

export const SUPPORTED_CHAINS = [
  baseSepoliaCustom, // Primary testnet
  baseMainnetCustom, // Primary mainnet
] as const

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
      showQrModal: true,
      metadata: {
        name: "newnity",
        description: "USDC crowdfunding platform with FanFi layer",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://newnity.vercel.app",
        icons: ["https://newnity.vercel.app/icon.png"],
      },
    }),
  ],
  transports: {
    [baseSepoliaCustom.id]: http(),
    [baseMainnetCustom.id]: http(),
  },
  ssr: true,
})

export const CONTRACT_ADDRESSES = {
  // Base Sepolia (testnet)
  [baseSepolia.id]: {
    MOCK_USDC: (process.env.NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA ||
      "0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB") as `0x${string}`, // Deployed Mock USDC
    ESCROW_VAULT: (process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA ||
      "0x6C52550E28152404c03f36089f9f652304C2AB51") as `0x${string}`, // Deployed Escrow contract
  },
  // Base Mainnet
  [base.id]: {
    MOCK_USDC: (process.env.NEXT_PUBLIC_USDC_BASE || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`,
    ESCROW_VAULT: (process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  },
} as const

export function getContractAddress(chainId: number, contract: "MOCK_USDC" | "ESCROW_VAULT"): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  return addresses[contract]
}

export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
  return chain?.name || `Chain ${chainId}`
}

export function isChainSupported(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES
}

// Legacy exports for backward compatibility
export const MOCK_USDC_ADDRESS = getContractAddress(baseSepolia.id, "MOCK_USDC")
export const ESCROW_VAULT_ADDRESS = getContractAddress(baseSepolia.id, "ESCROW_VAULT")

// Mock USDC ABI (simplified ERC20)
export const MOCK_USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
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
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Mock EscrowVault ABI
export const ESCROW_VAULT_ABI = [
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
] as const
