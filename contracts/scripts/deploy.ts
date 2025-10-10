import { ethers } from "hardhat"

async function main() {
  console.log("Deploying CampaignEscrow to Base Sepolia...")

  // Base Sepolia USDC address (you'll need to deploy a mock or use existing)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // Base Sepolia USDC

  // Platform wallet (should be a multisig in production)
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || "0x0000000000000000000000000000000000000000"

  const [deployer] = await ethers.getSigners()
  console.log("Deploying with account:", deployer.address)
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString())

  // Deploy CampaignEscrow
  const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow")
  const escrow = await CampaignEscrow.deploy(USDC_ADDRESS, PLATFORM_WALLET)

  await escrow.waitForDeployment()
  const escrowAddress = await escrow.getAddress()

  console.log("CampaignEscrow deployed to:", escrowAddress)
  console.log("\nDeployment Summary:")
  console.log("-------------------")
  console.log("Contract: CampaignEscrow")
  console.log("Address:", escrowAddress)
  console.log("USDC Token:", USDC_ADDRESS)
  console.log("Platform Wallet:", PLATFORM_WALLET)
  console.log("\nNext steps:")
  console.log("1. Update .env with NEXT_PUBLIC_ESCROW_VAULT=" + escrowAddress)
  console.log(
    "2. Verify contract: npx hardhat verify --network baseSepolia",
    escrowAddress,
    USDC_ADDRESS,
    PLATFORM_WALLET,
  )
  console.log("3. Test the contract on Sepolia")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
