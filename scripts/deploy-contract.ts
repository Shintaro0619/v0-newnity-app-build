import { ethers } from "ethers"

async function main() {
  console.log("🚀 Deploying CampaignEscrow to Base Sepolia...")

  // Get environment variables
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  const usdcAddress = process.env.NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA || "0xf6a99087519a7D86899aA73Eba522DF8FDD47121"
  const platformWallet = process.env.PLATFORM_WALLET || "0x77247CC270768611eb2fBc7759a7b34b9FB045Cd"

  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY not set in environment variables")
  }

  console.log("\n📋 Deployment Configuration:")
  console.log("----------------------------")
  console.log("RPC URL:", rpcUrl)
  console.log("USDC Address:", usdcAddress)
  console.log("Platform Wallet:", platformWallet)

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)

  console.log("\n👤 Deployer:", wallet.address)
  const balance = await provider.getBalance(wallet.address)
  console.log("Balance:", ethers.formatEther(balance), "ETH")

  if (balance === 0n) {
    throw new Error("Deployer wallet has no ETH. Please fund it first.")
  }

  // Contract bytecode and ABI
  const contractABI = [
    "constructor(address _usdcToken, address _platformWallet)",
    "function createCampaign(uint256 _goalAmount, uint256 _durationDays, uint256 _platformFeePercent) external returns (uint256)",
    "function pledge(uint256 _campaignId, uint256 _amount) external",
    "function finalizeCampaign(uint256 _campaignId) external",
    "function claimRefund(uint256 _campaignId) external",
    "function getCampaign(uint256 _campaignId) external view returns (address, uint256, uint256, uint256, bool, bool, uint256)",
    "function nextCampaignId() external view returns (uint256)",
    "event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goalAmount, uint256 deadline)",
  ]

  // You need to compile the contract first and get the bytecode
  // For now, we'll provide instructions
  console.log("\n⚠️  IMPORTANT: Contract Deployment Steps")
  console.log("=========================================")
  console.log("\n1. Compile the contract:")
  console.log("   cd contracts && npx hardhat compile")
  console.log("\n2. Deploy using Hardhat:")
  console.log("   npx hardhat run contracts/scripts/deploy.ts --network baseSepolia")
  console.log("\n3. Update environment variables:")
  console.log("   NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA=<deployed_address>")
  console.log("\n4. Verify the contract on Basescan:")
  console.log(`   npx hardhat verify --network baseSepolia <deployed_address> ${usdcAddress} ${platformWallet}`)
}

main()
  .then(() => {
    console.log("\n✅ Deployment script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message)
    process.exit(1)
  })
