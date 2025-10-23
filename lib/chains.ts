import { base, baseSepolia } from "wagmi/chains"

export const SUPPORTED_CHAIN_IDS = [base.id, baseSepolia.id]
export const PREFERRED_CHAIN_ID = baseSepolia.id // デフォルトはBase Sepolia
