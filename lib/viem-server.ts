import { createPublicClient, http } from "viem"
import { baseSepolia } from "viem/chains"

// Server-side public client for blockchain reads
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0]),
})
