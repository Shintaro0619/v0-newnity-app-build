# Newnity Smart Contracts

Simple All-or-Nothing escrow contracts for crowdfunding on Base.

## Setup

1. Install dependencies:
\`\`\`bash
cd contracts
npm install
\`\`\`

2. Create `.env` file:
\`\`\`bash
cp .env.example .env
# Edit .env with your values
\`\`\`

3. Compile contracts:
\`\`\`bash
npm run compile
\`\`\`

## Deploy to Base Sepolia

\`\`\`bash
npm run deploy:sepolia
\`\`\`

## Verify Contract

\`\`\`bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <USDC_ADDRESS> <PLATFORM_WALLET>
\`\`\`

## Contract Architecture

### CampaignEscrow.sol

Main escrow contract with All-or-Nothing logic:

- `createCampaign()` - Creator starts a new campaign
- `pledge()` - Backers pledge USDC
- `finalizeCampaign()` - Anyone can finalize after deadline
- `claimRefund()` - Backers claim refund if campaign failed

### Key Features

- USDC-based pledges
- Automatic fund release on success
- Automatic refund on failure
- Platform fee deduction (configurable)
- Reentrancy protection
- Emergency pause capability

## Testing

Get test USDC on Base Sepolia:
1. Bridge ETH to Base Sepolia: https://bridge.base.org/
2. Get test USDC from faucet or swap

## Security

- Uses OpenZeppelin contracts
- ReentrancyGuard on all state-changing functions
- Access control for admin functions
- Will be audited before mainnet deployment
