import { expect } from "chai"
import { ethers } from "hardhat"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("CampaignEscrow", () => {
  async function deployFixture() {
    const [owner, creator, backer1, backer2, platformWallet] = await ethers.getSigners()

    // Deploy mock USDC
    const MockUSDC = await ethers.getContractFactory("MockERC20")
    const usdc = await MockUSDC.deploy("USD Coin", "USDC", 6)

    // Deploy CampaignEscrow
    const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow")
    const escrow = await CampaignEscrow.deploy(await usdc.getAddress(), platformWallet.address)

    // Mint USDC to backers
    await usdc.mint(backer1.address, ethers.parseUnits("10000", 6))
    await usdc.mint(backer2.address, ethers.parseUnits("10000", 6))

    return { escrow, usdc, owner, creator, backer1, backer2, platformWallet }
  }

  describe("Campaign Creation", () => {
    it("Should create a campaign", async () => {
      const { escrow, creator } = await deployFixture()

      const goalAmount = ethers.parseUnits("1000", 6) // 1000 USDC
      const durationDays = 30
      const platformFee = 500 // 5%

      await expect(escrow.connect(creator).createCampaign(goalAmount, durationDays, platformFee))
        .to.emit(escrow, "CampaignCreated")
        .withArgs(1, creator.address, goalAmount, (await time.latest()) + 30 * 24 * 60 * 60)
    })
  })

  describe("Pledging", () => {
    it("Should allow pledging to a campaign", async () => {
      const { escrow, usdc, creator, backer1 } = await deployFixture()

      // Create campaign
      const goalAmount = ethers.parseUnits("1000", 6)
      await escrow.connect(creator).createCampaign(goalAmount, 30, 500)

      // Approve and pledge
      const pledgeAmount = ethers.parseUnits("100", 6)
      await usdc.connect(backer1).approve(await escrow.getAddress(), pledgeAmount)

      await expect(escrow.connect(backer1).pledge(1, pledgeAmount))
        .to.emit(escrow, "PledgeMade")
        .withArgs(1, backer1.address, pledgeAmount)
    })
  })

  describe("Campaign Finalization", () => {
    it("Should finalize successful campaign and release funds", async () => {
      const { escrow, usdc, creator, backer1, platformWallet } = await deployFixture()

      // Create campaign
      const goalAmount = ethers.parseUnits("1000", 6)
      await escrow.connect(creator).createCampaign(goalAmount, 30, 500)

      // Pledge enough to reach goal
      await usdc.connect(backer1).approve(await escrow.getAddress(), goalAmount)
      await escrow.connect(backer1).pledge(1, goalAmount)

      // Fast forward past deadline
      await time.increase(31 * 24 * 60 * 60)

      // Finalize
      await escrow.finalizeCampaign(1)

      // Check balances
      const platformFee = (goalAmount * BigInt(500)) / BigInt(10000)
      const creatorAmount = goalAmount - platformFee

      expect(await usdc.balanceOf(creator.address)).to.equal(creatorAmount)
      expect(await usdc.balanceOf(platformWallet.address)).to.equal(platformFee)
    })

    it("Should allow refunds for failed campaign", async () => {
      const { escrow, usdc, creator, backer1 } = await deployFixture()

      // Create campaign
      const goalAmount = ethers.parseUnits("1000", 6)
      await escrow.connect(creator).createCampaign(goalAmount, 30, 500)

      // Pledge less than goal
      const pledgeAmount = ethers.parseUnits("500", 6)
      await usdc.connect(backer1).approve(await escrow.getAddress(), pledgeAmount)
      await escrow.connect(backer1).pledge(1, pledgeAmount)

      const initialBalance = await usdc.balanceOf(backer1.address)

      // Fast forward past deadline
      await time.increase(31 * 24 * 60 * 60)

      // Finalize
      await escrow.finalizeCampaign(1)

      // Claim refund
      await escrow.connect(backer1).claimRefund(1)

      expect(await usdc.balanceOf(backer1.address)).to.equal(initialBalance + pledgeAmount)
    })
  })
})
