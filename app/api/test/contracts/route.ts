import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if contract addresses are configured
    const baseSepoliaUSDC = process.env.NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA
    const baseSepoliaEscrow = process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA
    const baseUSDC = process.env.NEXT_PUBLIC_USDC_BASE
    const baseEscrow = process.env.NEXT_PUBLIC_ESCROW_VAULT_BASE

    const hasTestnetContracts = !!(baseSepoliaUSDC && baseSepoliaEscrow)
    const hasMainnetContracts = !!(baseUSDC && baseEscrow)

    if (!hasTestnetContracts && !hasMainnetContracts) {
      return NextResponse.json(
        {
          success: false,
          error: "No contract addresses configured",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contract addresses configured",
      contracts: {
        baseSepolia: {
          usdc: baseSepoliaUSDC || "Not set",
          escrow: baseSepoliaEscrow || "Not set",
        },
        base: {
          usdc: baseUSDC || "Not set",
          escrow: baseEscrow || "Not set",
        },
      },
    })
  } catch (error) {
    console.error("[v0] Contract test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
