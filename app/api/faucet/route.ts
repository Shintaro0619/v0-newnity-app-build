import { type NextRequest, NextResponse } from "next/server"
import { isAddress, parseUnits, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"

const USDC = process.env.NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA as `0x${string}`
const PK = (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
const RPC = process.env.BASE_SEPOLIA_RPC_URL

const MINT_FUNCTION_NAME = (process.env.FAUCET_MINT_FUNCTION_NAME || "mint") as "mint" | "faucet"

const MINT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export async function POST(req: NextRequest) {
  try {
    const { address, amount } = await req.json()
    if (!isAddress(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 })

    const amt = Number(amount ?? 500)
    if (!Number.isFinite(amt) || amt <= 0 || amt > 1000000)
      return NextResponse.json({ error: "Bad amount" }, { status: 400 })

    if (!USDC || !PK || !RPC) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

    const account = privateKeyToAccount(PK)
    const client = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) })

    const txHash = await client.writeContract({
      address: USDC,
      abi: MINT_ABI,
      functionName: MINT_FUNCTION_NAME,
      args: [address, parseUnits(String(amt), 6)],
    })

    return NextResponse.json({ ok: true, txHash })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
