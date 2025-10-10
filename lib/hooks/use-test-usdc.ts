import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { USDC_ABI } from "@/lib/contracts/usdc-abi"
import { getUSDCAddress } from "@/lib/contracts/contract-addresses"

export function useTestUSDC() {
  const { chainId, address } = useAccount()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const usdcAddress = getUSDCAddress(chainId)

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  const mintTestUSDC = async (amount: string) => {
    if (!address) {
      console.error("[v0] No wallet address connected")
      return
    }

    console.log("[v0] Minting USDC:", { amount, usdcAddress, chainId, to: address })

    writeContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: "mint",
      args: [address, parseUnits(amount, 6)],
    })
  }

  return {
    mintTestUSDC,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    balance: balance ? formatUnits(balance as bigint, 6) : "0",
    refetchBalance,
  }
}
