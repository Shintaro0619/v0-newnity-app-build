# Newnity Testing Guide

Complete guide for testing the Newnity crowdfunding platform on Base Sepolia testnet.

## Prerequisites

### 1. Wallet Setup
- Install MetaMask browser extension
- Add Base Sepolia network to MetaMask:
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency Symbol: ETH
  - Block Explorer: https://sepolia.basescan.org

### 2. Get Test Tokens

**Base Sepolia ETH (for gas fees):**
- Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Connect your wallet
- Request test ETH (you'll need ~0.01 ETH for testing)

**Test USDC (for pledging):**
- Visit: http://localhost:3000/test (or your deployed URL)
- Click "Get Test USDC" button
- Confirm transaction in MetaMask
- You'll receive 1000 test USDC

## Testing Scenarios

### Scenario 1: Create a Campaign

**Objective:** Test the campaign creation flow from UI to blockchain to database.

**Steps:**
1. Navigate to `/create`
2. Connect your wallet (top right)
3. Fill in campaign details:
   - **Step 1 - Basics:**
     - Title: "Test VR Game Project"
     - Subtitle: "Revolutionary VR gaming experience"
     - Description: Add detailed description
     - Category: Select "Games"
   
   - **Step 2 - Media:**
     - Upload a main image (required)
     - Optionally add gallery images
   
   - **Step 3 - Funding:**
     - Goal: 1000 USDC
     - Duration: 30 days
   
   - **Step 4 - Rewards:**
     - Add at least one reward tier
     - Example: "Early Bird" - $25 - "Get the game at launch"

4. Click "Create Campaign"
5. Confirm transaction in MetaMask
6. Wait for blockchain confirmation (~10-30 seconds)
7. Campaign should be created and saved to database

**Expected Results:**
- Transaction succeeds on Base Sepolia
- Campaign appears in database
- Redirected to success page
- Campaign visible on homepage

**Verification:**
- Check transaction on Basescan: https://sepolia.basescan.org/tx/[YOUR_TX_HASH]
- Visit `/campaigns` to see your campaign listed
- Campaign should show correct goal, duration, and 0 raised

---

### Scenario 2: Pledge to a Campaign

**Objective:** Test the two-step pledge flow (USDC approval + pledge).

**Prerequisites:**
- Have test USDC in your wallet (from `/test` page)
- Have a campaign to pledge to

**Steps:**
1. Navigate to a campaign detail page
2. Click "Back This Project" button
3. Enter pledge amount (e.g., 50 USDC)
4. **Step 1 - Approve USDC:**
   - Click "Approve USDC"
   - Confirm transaction in MetaMask
   - Wait for confirmation
5. **Step 2 - Submit Pledge:**
   - Click "Submit Pledge"
   - Confirm transaction in MetaMask
   - Wait for confirmation
6. Modal should show success message

**Expected Results:**
- USDC approval transaction succeeds
- Pledge transaction succeeds
- Campaign raised amount increases
- Backer count increases by 1
- Your USDC balance decreases

**Verification:**
- Check both transactions on Basescan
- Refresh page - raised amount should update
- Check smart contract state on Basescan

---

### Scenario 3: Campaign Reaches Goal (Success)

**Objective:** Test successful campaign finalization and fund distribution.

**Prerequisites:**
- Campaign with pledges totaling >= goal amount
- Campaign duration has ended (or manually set short duration)

**Steps:**
1. Wait for campaign to end (or create campaign with 1-day duration for testing)
2. Navigate to campaign detail page
3. If you're the creator, you'll see "Finalize Campaign" button
4. Click "Finalize Campaign"
5. Confirm transaction in MetaMask
6. Wait for confirmation

**Expected Results:**
- Campaign status changes to "FUNDED"
- Creator receives funds (goal amount - 5% platform fee)
- Platform wallet receives 5% fee
- Campaign marked as finalized on blockchain

**Verification:**
- Check creator wallet balance (should increase)
- Check platform wallet balance (should receive 5%)
- Campaign status shows "FUNDED"
- No refund button appears for backers

---

### Scenario 4: Campaign Fails (Refund)

**Objective:** Test failed campaign and refund mechanism.

**Prerequisites:**
- Campaign with pledges totaling < goal amount
- Campaign duration has ended

**Steps:**
1. Create campaign with high goal (e.g., 10,000 USDC)
2. Pledge small amount (e.g., 100 USDC)
3. Wait for campaign to end
4. Anyone can call "Finalize Campaign"
5. Campaign should be marked as FAILED
6. As a backer, click "Claim Refund"
7. Confirm transaction in MetaMask

**Expected Results:**
- Campaign status changes to "FAILED"
- Refund button appears for backers
- Backer receives full pledge amount back
- Creator receives nothing

**Verification:**
- Check backer wallet balance (should return to original)
- Campaign shows "FAILED" status
- Smart contract shows campaign as finalized but unsuccessful

---

### Scenario 5: Multiple Backers

**Objective:** Test campaign with multiple backers from different wallets.

**Prerequisites:**
- Multiple MetaMask accounts with test ETH and USDC
- One active campaign

**Steps:**
1. Switch between MetaMask accounts
2. Each account pledges different amounts
3. Verify total raised amount updates correctly
4. Verify backer count increases

**Expected Results:**
- Each pledge transaction succeeds independently
- Total raised = sum of all pledges
- Backer count = number of unique backers
- Each backer can claim refund if campaign fails

---

## Smart Contract Verification

### View Contract on Basescan

1. Visit: https://sepolia.basescan.org/address/0x77247cc270768611eb2fbc7759a7b34b9fb045cd
2. Click "Contract" tab
3. Click "Read Contract" to view:
   - Campaign details (goal, deadline, totalPledged)
   - Platform fee percentage
   - Platform wallet address
4. Click "Write Contract" to interact directly (advanced)

### Key Functions to Test

**Read Functions:**
- `getCampaign(uint256 _campaignId)` - Get campaign details
- `getPledgeAmount(uint256 _campaignId, address _backer)` - Check pledge amount
- `isActive(uint256 _campaignId)` - Check if campaign is active

**Write Functions:**
- `createCampaign(uint256 _goal, uint256 _duration)` - Create campaign
- `pledge(uint256 _campaignId, uint256 _amount)` - Make pledge
- `finalizeCampaign(uint256 _campaignId)` - Finalize campaign
- `refund(uint256 _campaignId)` - Claim refund

---

## Common Issues & Solutions

### Issue: Transaction Fails with "Insufficient Funds"
**Solution:** Get more test ETH from faucet for gas fees

### Issue: "Insufficient Allowance" Error
**Solution:** Approve USDC spending before pledging

### Issue: Campaign Not Appearing
**Solution:** 
- Check if transaction confirmed on Basescan
- Refresh page
- Check browser console for errors

### Issue: Can't Finalize Campaign
**Solution:**
- Ensure campaign duration has ended
- Check if already finalized
- Verify you have enough ETH for gas

### Issue: Refund Button Not Showing
**Solution:**
- Campaign must be finalized first
- Campaign must have failed (not reached goal)
- You must have pledged to the campaign

---

## Performance Benchmarks

**Expected Transaction Times (Base Sepolia):**
- Campaign Creation: 10-30 seconds
- USDC Approval: 5-15 seconds
- Pledge: 10-30 seconds
- Finalize: 10-30 seconds
- Refund: 10-30 seconds

**Gas Costs (approximate):**
- Create Campaign: ~200,000 gas
- Approve USDC: ~50,000 gas
- Pledge: ~100,000 gas
- Finalize: ~150,000 gas
- Refund: ~80,000 gas

---

## Test Data Cleanup

To reset test data:

1. **Clear Database:**
   \`\`\`bash
   # Run the cleanup script
   npm run db:reset
   \`\`\`

2. **Clear Browser Data:**
   - Clear localStorage
   - Clear cookies
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

3. **Reset MetaMask:**
   - Settings → Advanced → Reset Account
   - This clears transaction history

---

## Reporting Issues

When reporting bugs, include:
1. Transaction hash (if applicable)
2. Wallet address used
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser console errors
6. Screenshots

**Example Bug Report:**
\`\`\`
Title: Pledge fails after USDC approval

Steps:
1. Approved 100 USDC
2. Clicked "Submit Pledge"
3. Transaction reverted

Transaction: 0x123...
Wallet: 0xabc...
Error: "Insufficient allowance"
\`\`\`

---

## Next Steps After Testing

1. Document any bugs found
2. Test edge cases (0 amount, very large amounts)
3. Test with slow network conditions
4. Test on mobile browsers
5. Prepare demo video for hackathon submission
