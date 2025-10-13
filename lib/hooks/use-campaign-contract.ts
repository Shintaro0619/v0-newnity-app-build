"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import { parseUnits, decodeEventLog } from "viem"
import { toast } from "sonner"
import { CAMPAIGN_ESCROW_ABI } from "@/lib/contracts/campaign-escrow-abi"
import { USDC_ABI } from "@/lib/contracts/usdc-abi"
import { getContractAddress } from "@/lib/contracts/contract-addresses"
import { baseSepolia } from "wagmi/chains"
import { savePledgeToDatabase } from "@/lib/actions/campaigns"
import { useEffect } from "react"

export function useCampaignContract(campaignId?: number) {
  const { address, chainId = baseSepolia.id } = useAccount()
  const escrowAddress = getContractAddress(chainId, "campaignEscrow")
  const usdcAddress = getContractAddress(chainId, "usdc")
  const publicClient = usePublicClient()

  const { data: campaignDataRaw, refetch: refetchCampaign } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getCampaign",
    args: campaignId !== undefined ? [BigInt(campaignId)] : undefined,
    query: {
      enabled: campaignId !== undefined,
    },
  })

  const campaignData = campaignDataRaw
    ? {
        creator: campaignDataRaw[0] as `0x${string}`,
        goal: campaignDataRaw[1] as bigint,
        totalPledged: campaignDataRaw[2] as bigint,
        deadline: campaignDataRaw[3] as bigint,
        finalized: campaignDataRaw[4] as boolean,
        successful: campaignDataRaw[5] as boolean,
        platformFeePercent: campaignDataRaw[6] as bigint,
      }
    : undefined

  const isActive =
    campaignData && !campaignData.finalized && Number(campaignData.deadline) > Date.now() / 1000 ? true : false

  const { data: pledgeDataRaw } = useReadContract({
    address: escrowAddress,
    abi: CAMPAIGN_ESCROW_ABI,
    functionName: "getPledge",
    args: campaignId !== undefined && address ? [BigInt(campaignId), address] : undefined,
    query: {
      enabled: campaignId !== undefined && !!address,
    },
  })

  const pledgeAmount = pledgeDataRaw ? (pledgeDataRaw[0] as bigint) : undefined

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
  const { writeContract: pledge, data: pledgeHash, isPending: isPledgePending, error: pledgeError } = useWriteContract()

  useEffect(() => {
    console.log("[v0] Pledge hash changed:", {
      pledgeHash: pledgeHash || "undefined",
      isPledgePending,
      hasError: !!pledgeError,
    })

    if (pledgeError) {
      console.error("[v0] Pledge error:", pledgeError)
      toast.error(`Pledge failed: ${pledgeError.message}`)
    }
  }, [pledgeHash, isPledgePending, pledgeError])

  const { isLoading: isPledgeLoading, isSuccess: isPledgeSuccess } = useWaitForTransactionReceipt({
    hash: pledgeHash,
    onSuccess: async (receipt) => {
      console.log("[v0] Pledge transaction confirmed:", { hash: pledgeHash, blockNumber: receipt.blockNumber })
      toast.success("Pledge successful!")
      refetchCampaign()

      console.log("[v0] Checking conditions for saving pledge:", {
        campaignId,
        address,
        pledgeHash,
        hasAllValues: !!(campaignId && address && pledgeHash),
      })

      if (campaignId && address && pledgeHash) {
        try {
          console.log("[v0] Attempting to save pledge to database...")

          // Extract pledge amount from transaction logs
          const pledgeLog = receipt.logs.find((log) => {
            try {
              const decoded = decodeEventLog({
                abi: CAMPAIGN_ESCROW_ABI,
                data: log.data,
                topics: log.topics,
              })
              return decoded.eventName === "PledgeMade"
            } catch {
              return false
            }
          })

          if (!pledgeLog) {
            console.error("[v0] PledgeMade event not found in transaction logs")
            console.log("[v0] Available logs:", receipt.logs.length)
            return
          }

          const decoded = decodeEventLog({
            abi: CAMPAIGN_ESCROW_ABI,
            data: pledgeLog.data,
            topics: pledgeLog.topics,
          })

          console.log("[v0] Decoded pledge event:", decoded)

          console.log("[v0] Fetching campaign from database with blockchain ID:", campaignId)
          const response = await fetch(`/api/campaigns/${campaignId}/by-blockchain-id`)

          console.log("[v0] API response status:", response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("[v0] Failed to fetch campaign from database:", response.statusText, errorText)
            return
          }

          const campaign = await response.json()
          console.log("[v0] Campaign fetched from database:", campaign)

          if (!campaign || !campaign.id) {
            console.error("[v0] Campaign not found in database for blockchain ID:", campaignId)
            return
          }

          const amountInUsdc = Number(decoded.args.amount) / 1e6 // Convert from wei to USDC

          console.log("[v0] Saving pledge with data:", {
            campaignId: campaign.id,
            backerWalletAddress: address,
            amount: amountInUsdc,
            txHash: pledgeHash,
            blockNumber: Number(receipt.blockNumber),
          })

          const result = await savePledgeToDatabase({
            campaignId: campaign.id,
            backerWalletAddress: address,
            amount: amountInUsdc,
            txHash: pledgeHash,
            blockNumber: Number(receipt.blockNumber),
          })

          console.log("[v0] savePledgeToDatabase result:", result)

          if (result.success) {
            console.log("[v0] Pledge saved to database successfully")
          } else {
            console.error("[v0] Failed to save pledge to database:", result.error)
          }
        } catch (error) {
          console.error("[v0] Failed to save pledge to database:", error)
          // Don't throw - pledge was successful on blockchain
        }
      } else {
        console.log("[v0] Skipping pledge save - missing required values:", {
          campaignId: campaignId || "missing",
          address: address || "missing",
          pledgeHash: pledgeHash || "missing",
        })
      }
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
    onSuccess: async (receipt) => {
      console.log("[v0] Campaign finalized on blockchain:", { hash: finalizeHash, blockNumber: receipt.blockNumber })
      toast.success("Campaign finalized!")
      refetchCampaign()

      // Extract finalization data from logs
      try {
        const finalizeLog = receipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: CAMPAIGN_ESCROW_ABI,
              data: log.data,
              topics: log.topics,
            })
            return decoded.eventName === "CampaignFinalized"
          } catch {
            return false
          }
        })

        if (finalizeLog && campaignId && finalizeHash) {
          const decoded = decodeEventLog({
            abi: CAMPAIGN_ESCROW_ABI,
            data: finalizeLog.data,
            topics: finalizeLog.topics,
          })

          console.log("[v0] Decoded finalize event:", decoded)

          // Fetch campaign from database
          const response = await fetch(`/api/campaigns/${campaignId}/by-blockchain-id`)
          if (!response.ok) {
            console.error("[v0] Failed to fetch campaign from database")
            return
          }

          const campaign = await response.json()
          if (!campaign || !campaign.id) {
            console.error("[v0] Campaign not found in database")
            return
          }

          const totalAmountInUsdc = Number(decoded.args.totalAmount) / 1e6

          // Update database
          const { finalizeCampaignInDatabase } = await import("@/lib/actions/campaigns")
          await finalizeCampaignInDatabase({
            campaignId: campaign.id,
            successful: decoded.args.successful as boolean,
            txHash: finalizeHash,
            totalAmount: totalAmountInUsdc,
          })

          console.log("[v0] Campaign finalized in database")
        }
      } catch (error) {
        console.error("[v0] Failed to update database after finalization:", error)
      }
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
    console.log("[v0] handlePledge called:", { campaignId, amount })
    const amountInWei = parseUnits(amount, 6)
    console.log("[v0] Calling pledge contract function with:", {
      campaignId: BigInt(campaignId).toString(),
      amountInWei: amountInWei.toString(),
      escrowAddress,
    })

    try {
      pledge({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "pledge",
        args: [BigInt(campaignId), amountInWei],
        gas: 500000n,
      })
      console.log("[v0] pledge() function called successfully")
    } catch (error) {
      console.error("[v0] Error calling pledge():", error)
      toast.error("Failed to initiate pledge transaction")
    }
  }

  const handleCreateCampaign = async (goal: string, durationInDays: number, platformFeePercent = 500) => {
    console.log("[v0] handleCreateCampaign called:", { goal, durationInDays, platformFeePercent })

    try {
      const goalInWei = parseUnits(goal, 6)
      const durationDays = BigInt(durationInDays)
      const feeInBasisPoints = BigInt(platformFeePercent)

      console.log("[v0] Calling createCampaign with:", {
        goalInWei: goalInWei.toString(),
        goalInUSDC: goal,
        durationDays: durationDays.toString(),
        platformFeePercent: feeInBasisPoints.toString(),
      })

      return createCampaign({
        address: escrowAddress,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: "createCampaign",
        args: [goalInWei, durationDays, feeInBasisPoints],
        gas: 500000n,
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
      gas: 500000n,
    })
  }

  const handleRefund = (campaignId: number) => {
    refund({
      address: escrowAddress,
      abi: CAMPAIGN_ESCROW_ABI,
      functionName: "claimRefund",
      args: [BigInt(campaignId)],
      gas: 500000n,
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
    pledgeError,

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
