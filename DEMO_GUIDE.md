# Newnity Demo Guide

Complete walkthrough for testing all features on Base Sepolia testnet.

## Prerequisites Setup (5 minutes)

### 1. Install MetaMask
- Download from https://metamask.io
- Create new wallet or import existing

### 2. Add Base Sepolia Network
\`\`\`
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
\`\`\`

### 3. Get Test ETH
- Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Enter your wallet address
- Receive 0.1 ETH (enough for ~100 transactions)

### 4. Get Test USDC
- Visit: https://[your-app]/test
- Click "Get Test USDC"
- Receive 1000 USDC for testing

## Demo Scenario 1: Successful Campaign (10 minutes)

### Step 1: Create Campaign
1. Navigate to "Create Campaign"
2. Fill in details:
   \`\`\`
   Title: "Revolutionary Gaming Console"
   Description: "Next-gen gaming experience"
   Goal: 100 USDC
   Duration: 1 day
   Category: Tech
   \`\`\`
3. Click "Create Campaign"
4. Confirm transaction in MetaMask
5. Wait 2-3 seconds for confirmation
6. Note the campaign ID from URL

### Step 2: Make First Pledge
1. Open campaign detail page
2. Click "Back this project"
3. Enter amount: 50 USDC
4. Click "Approve USDC" (first time only)
5. Confirm approval transaction
6. Click "Pledge"
7. Confirm pledge transaction
8. See progress bar update to 50%

### Step 3: Reach Goal
1. Open campaign in different wallet/browser
2. Pledge 60 USDC (total: 110 USDC)
3. Progress bar shows 110% (goal exceeded)
4. Campaign status: "Funding"

### Step 4: Wait for Deadline
- Option A: Wait 24 hours for real deadline
- Option B: Use Remix to manually advance time (advanced)

### Step 5: Finalize Campaign
1. After deadline passes, click "Finalize Campaign"
2. Confirm transaction
3. Contract automatically:
   - Sends 95 USDC to creator (100 - 5% fee)
   - Sends 5 USDC to platform wallet
   - Marks campaign as successful

### Step 6: Verify on Basescan
1. Visit campaign contract on Basescan
2. Check "Events" tab
3. See `Finalized` event with `successful: true`
4. See `FundsReleased` event with amounts

## Demo Scenario 2: Failed Campaign with Refunds (10 minutes)

### Step 1: Create Campaign
\`\`\`
Title: "Indie Film Project"
Goal: 200 USDC
Duration: 1 day
\`\`\`

### Step 2: Partial Pledges
- Wallet 1: Pledge 50 USDC
- Wallet 2: Pledge 30 USDC
- Total: 80 USDC (40% of goal)

### Step 3: Let Deadline Pass
- Wait for campaign to expire
- Status changes to "Ended"

### Step 4: Finalize Campaign
1. Click "Finalize Campaign"
2. Contract determines: totalPledged < goal
3. Campaign marked as failed
4. Refunds enabled

### Step 5: Claim Refunds
1. Each backer clicks "Claim Refund"
2. Receives full pledge amount back
3. No fees deducted
4. Pledge balance resets to 0

### Step 6: Verify Refunds
- Check wallet balances
- Confirm full USDC returned
- Check Basescan for `Refunded` events

## Demo Scenario 3: Real-time Updates (5 minutes)

### Test Multi-User Experience
1. Open campaign in two browser windows
2. Pledge from Window 1
3. Watch Window 2 update automatically
4. Progress bar, backer count, and amount update in real-time

## Testing Checklist

### Smart Contract Functions
- [ ] createCampaign() - Creates new campaign
- [ ] pledge() - Accepts USDC contributions
- [ ] finalizeCampaign() - Determines success/failure
- [ ] refund() - Returns funds if failed
- [ ] getCampaign() - Retrieves campaign data

### Frontend Features
- [ ] Campaign creation form
- [ ] Campaign discovery (homepage)
- [ ] Category filtering
- [ ] Search functionality
- [ ] Pledge modal with 2-step flow
- [ ] Real-time progress updates
- [ ] Transaction status feedback
- [ ] Error handling
- [ ] Mobile responsiveness

### Edge Cases
- [ ] Pledge exactly goal amount
- [ ] Pledge more than goal
- [ ] Multiple pledges from same wallet
- [ ] Finalize before deadline (should fail)
- [ ] Double refund attempt (should fail)
- [ ] Pledge to finalized campaign (should fail)

## Troubleshooting

### "Insufficient allowance" error
- Solution: Click "Approve USDC" first

### "Campaign has ended" error
- Solution: Campaign deadline passed, cannot pledge

### Transaction stuck
- Solution: Check MetaMask activity tab, speed up or cancel

### Wrong network
- Solution: Switch MetaMask to Base Sepolia

### Out of gas
- Solution: Get more ETH from faucet

## Performance Metrics

Expected transaction times on Base Sepolia:
- Campaign creation: 2-3 seconds
- USDC approval: 2-3 seconds
- Pledge: 2-3 seconds
- Finalize: 2-3 seconds
- Refund: 2-3 seconds

Gas costs (approximate):
- Campaign creation: 0.0001 ETH
- USDC approval: 0.00005 ETH
- Pledge: 0.00008 ETH
- Finalize: 0.0001 ETH
- Refund: 0.00006 ETH

## Video Recording Tips

For Base Batches submission video:
1. Start with problem statement (5 seconds)
2. Show campaign creation (10 seconds)
3. Demonstrate pledge flow (15 seconds)
4. Show finalization (10 seconds)
5. Highlight Base benefits (10 seconds)
6. End with vision (10 seconds)

Total: 60 seconds
