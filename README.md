# Newnity - All-or-Nothing Crowdfunding on Base

A decentralized crowdfunding platform built on Base L2, featuring USDC-based campaigns with transparent All-or-Nothing escrow mechanics.

## 🎯 Overview

Newnity enables creators to launch crowdfunding campaigns with guaranteed outcomes:
- **Goal Reached**: Funds automatically released to creator (minus 5% platform fee)
- **Goal Not Reached**: Full automatic refunds to all backers

Built for Base Batches 002 - demonstrating secure, transparent crowdfunding using Base L2 and USDC stablecoins.

## ✨ Key Features

### All-or-Nothing Escrow
- Smart contract-based fund management
- Automatic fund release or refund based on campaign success
- No manual intervention required

### USDC Payments
- Stable, predictable contributions
- No crypto volatility risk for backers or creators
- Native Base Sepolia USDC integration

### Transparent On-Chain
- All transactions verifiable on Base Sepolia
- Real-time campaign progress tracking
- Immutable pledge records

## 🏗️ Architecture

### Smart Contracts (Base Sepolia)
- **CampaignEscrow**: `0x77247cc270768611eb2fbc7759a7b34b9fb045cd`
- **USDC Token**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Tech Stack
- **Blockchain**: Base Sepolia (L2)
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Frontend**: Next.js 15, React, TypeScript
- **Web3**: Wagmi, Viem
- **Database**: PostgreSQL (Neon)
- **Styling**: Tailwind CSS v4

## 🚀 Quick Start Demo

### Prerequisites
1. MetaMask wallet with Base Sepolia network
2. Base Sepolia ETH for gas (get from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
3. Test USDC tokens (use our built-in faucet at `/test`)

### Demo Flow

#### 1. Get Test USDC
\`\`\`
Visit: https://[your-app-url]/test
Click "Get Test USDC" to receive 1000 USDC
\`\`\`

#### 2. Create a Campaign
\`\`\`
1. Navigate to "Create Campaign"
2. Fill in campaign details:
   - Title: "My Test Project"
   - Goal: 100 USDC
   - Duration: 7 days
3. Click "Create Campaign"
4. Confirm transaction in MetaMask
5. Wait for confirmation (~2 seconds)
\`\`\`

#### 3. Pledge to Campaign
\`\`\`
1. Find your campaign on homepage
2. Click "Back this project"
3. Enter pledge amount (e.g., 50 USDC)
4. Approve USDC spending (first time only)
5. Confirm pledge transaction
6. See progress bar update in real-time
\`\`\`

#### 4. Test Success Scenario
\`\`\`
1. Pledge enough to reach goal (100+ USDC total)
2. Wait for campaign deadline to pass
3. Click "Finalize Campaign"
4. Creator receives funds (95 USDC after 5% fee)
5. Platform receives fee (5 USDC)
\`\`\`

#### 5. Test Refund Scenario
\`\`\`
1. Create another campaign
2. Pledge less than goal amount
3. Wait for deadline to pass
4. Click "Finalize Campaign"
5. Click "Claim Refund"
6. Receive full pledge amount back
\`\`\`

## 📝 Smart Contract Functions

### For Creators
- `createCampaign(goal, duration)` - Launch new campaign
- `finalizeCampaign(campaignId)` - Trigger fund release/refund after deadline

### For Backers
- `pledge(campaignId, amount)` - Contribute USDC to campaign
- `refund(campaignId)` - Claim refund if campaign failed

### View Functions
- `getCampaign(campaignId)` - Get campaign details
- `getPledgeAmount(campaignId, backer)` - Check pledge amount
- `isActive(campaignId)` - Check if campaign is still accepting pledges

## 🔒 Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **SafeERC20**: Safe token transfer operations
- **Access Control**: Owner-only admin functions
- **OpenZeppelin**: Battle-tested contract libraries

## 🎨 UI/UX Highlights

- Responsive design (mobile-first)
- Real-time blockchain data updates
- Clear transaction status feedback
- Category-based campaign discovery
- Sidebar filtering and search

## 📊 Contract Verification

View verified contract on Basescan:
\`\`\`
https://sepolia.basescan.org/address/0x77247cc270768611eb2fbc7759a7b34b9fb045cd
\`\`\`

## 🛣️ Roadmap

### Phase 1 (Current - MVP)
- ✅ All-or-Nothing escrow
- ✅ USDC payments
- ✅ Campaign creation
- ✅ Pledge & refund functionality

### Phase 2 (Post-Base Batches)
- Milestone-based fund release
- Multi-chain support (Base Mainnet)
- Creator reputation system
- Backer rewards (Pulse Credits)

### Phase 3 (Future)
- 3-tier yield strategy (Aave, Compound, T-bills)
- NFT receipts (SBT)
- Secondary market for campaign NFTs
- DAO governance

## 🏆 Base Batches Submission

**Category**: Builder Track  
**Focus**: DeFi Infrastructure on Base L2  
**Innovation**: Transparent crowdfunding with automatic escrow settlement

### Why Base?
- Low transaction costs for frequent pledges
- Fast finality for better UX
- Growing ecosystem of DeFi primitives
- Seamless USDC integration

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Demo**: [Your deployment URL]
- **Contract**: [Basescan link](https://sepolia.basescan.org/address/0x77247cc270768611eb2fbc7759a7b34b9fb045cd)
- **GitHub**: [Your repo URL]

## 👥 Team

Built by [Your Name/Team] for Base Batches 002

---

**Note**: This is a testnet deployment. Do not use real funds.
