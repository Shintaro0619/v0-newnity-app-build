"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import { parseUnits, decodeEventLog } from "viem"
import { toast } from "sonner"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { USDC_ABI } from "@/lib/contracts/usdc-abi"
import { getContractAddress } from "@/lib/contracts/contract-addresses"
import { baseSepolia } from "wagmi/chains"

export function useCampaignContract(campaignId?: number) {
  const { address, chainId = baseSepolia.id } = useAccount()
  const escrowAddress = getContractAddress(chainId, "campaignEscrow")
  const usdcAddress = getContractAddress(chainId, "usdc")
  const publicClient = usePublicClient()

  // Read campaign data
  const { data: campaignData, refetch: refetchCampaign } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getCampaign",
    args: campaignId !== undefined ? [BigInt(campaignId)] : undefined,
    query: {
      enabled: campaignId !== undefined,
    },
  })

  // Check if campaign is active
  const { data: isActive } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "isActive",
    args: campaignId !== undefined ? [BigInt(campaignId)] : undefined,
    query: {
      enabled: campaignId !== undefined,
    },
  })

  // Get user's pledge amount
  const { data: pledgeAmount } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getPledgeAmount",
    args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
    query: {
      enabled: campaignId !== undefined && !!address,
    },
  })

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })

  // Check USDC allowance
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, escrowAddress] : undefined,
  })

  // Approve USDC
  const { writeContract: approveUsdc, data: approveHash, isPending: isApprovePending } = useWriteContract()

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      toast.success("USDC approved successfully")
      refetchAllowance()
    },
  })

  // Pledge to campaign
  const { writeContract: pledge, data: pledgeHash, isPending: isPledgePending } = useWriteContract()

  const { isLoading: isPledgeLoading, isSuccess: isPledgeSuccess } = useWaitForTransactionReceipt({
    hash: pledgeHash,
    onSuccess: () => {
      toast.success("Pledge successful!")
      refetchCampaign()
    },
  })

  // Create campaign
  const {
    writeContract: createCampaign,
    data: createHash,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract()

  const { isLoading: isCreateLoading, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
    onSuccess: () => {
      toast.success("Campaign created successfully!")
    },
  })

  // Finalize campaign
  const { writeContract: finalizeCampaign, data: finalizeHash, isPending: isFinalizePending } = useWriteContract()

  const { isLoading: isFinalizeLoading, isSuccess: isFinalizeSuccess } = useWaitForTransactionReceipt({
    hash: finalizeHash,
    onSuccess: () => {
      toast.success("Campaign finalized!")
      refetchCampaign()
    },
  })

  // Refund
  const { writeContract: refund, data: refundHash, isPending: isRefundPending } = useWriteContract()

  const { isLoading: isRefundLoading, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: refundHash,
    onSuccess: () => {
      toast.success("Refund successful!")
      refetchCampaign()
    },
  })

  const handleApprove = (amount: string) => {
    const amountInWei = parseUnits(amount, 6) // USDC has 6 decimals
    approveUsdc({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: "approve",
      args: [escrowAddress, amountInWei],
    })
  }

  const handlePledge = (campaignId: number, amount: string) => {
    const amountInWei = parseUnits(amount, 6)
    pledge({
      address: escrowAddress,
      abi: CAMPAIGN_ESCROW_ABI,
      functionName: "pledge",
      args: [BigInt(campaignId), amountInWei],
    })
  }

  const handleCreateCampaign = async (goal: string, durationInDays: number, platformFeePercent = 500) => {
    console.log("[v0] handleCreateCampaign called:", { goal, durationInDays, platformFeePercent })

    try {
      const goalInWei = parseUnits(goal, 6)
      const durationDays = BigInt(durationInDays)
      const feeInBasisPoints = BigInt(platformFeePercent)

      console.log("[v0] Calling createCampaign with:", {
        goalInWei: goalInWei.toString(),
        durationDays: durationDays.toString(),
        platformFeePercent: feeInBasisPoints.toString(),
      })

      return createCampaign({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, durationDays, feeInBasisPoints],
      })
    } catch (error) {
      console.error("[v0] handleCreateCampaign error:", error)
      throw error
    }
  }

  const handleFinalize = (campaignId: number) => {
    finalizeCampaign({
      address: escrowAddress,
      abi: CAMPAIGN_ESCROW_ABI,
      functionName: "finalizeCampaign",
      args: [BigInt(campaignId)],
    })
  }

  const handleRefund = (campaignId: number) => {
    refund({
      address: escrowAddress,
      abi: CAMPAIGN_ESCROW_ABI,
      functionName: "refund",
      args: [BigInt(campaignId)],
    })
  }

  const extractCampaignIdFromReceipt = async (txHash: `0x${string}`): Promise<number | null> => {
    if (!publicClient) return null

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // Find CampaignCreated event in logs
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: CAMPAIGN_ESCROW_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === "CampaignCreated") {
            return Number(decoded.args.campaignId)
          }
        } catch (e) {
          // Skip logs that don't match our ABI
          continue
        }
      }

      return null
    } catch (error) {
      console.error("[v0] Failed to extract campaign ID:", error)
      return null
    }
  }

  return {
    // Contract addresses
    escrowAddress,
    usdcAddress,

    // Campaign data
    campaignData,
    isActive,
    pledgeAmount,

    // USDC data
    usdcBalance,
    usdcAllowance,

    // Approve
    handleApprove,
    isApprovePending,
    isApproveLoading,
    isApproveSuccess,
    approveHash,

    // Pledge
    handlePledge,
    isPledgePending,
    isPledgeLoading,
    isPledgeSuccess,
    pledgeHash,

    // Create campaign
    handleCreateCampaign,
    isCreatePending,
    isCreateLoading,
    isCreateSuccess,
    createHash,
    createError,

    // Finalize
    handleFinalize,
    isFinalizePending,
    isFinalizeLoading,
    isFinalizeSuccess,
    finalizeHash,

    // Refund
    handleRefund,
    isRefundPending,
    isRefundLoading,
    isRefundSuccess,
    refundHash,

    // Refetch
    refetchCampaign,
    refetchAllowance,

    // Extract campaign ID from receipt
    extractCampaignIdFromReceipt,
  }
}
