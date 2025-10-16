# Campaign Finalize & Refund Testing Checklist

## Pre-Test Setup

### Database Verification
- [ ] Run `npm run dev` and execute `/scripts/verify-campaigns.ts`
- [ ] Verify test9 campaign exists in database
- [ ] Verify test10 campaign exists in database
- [ ] Confirm `blockchain_campaign_id` is set for both campaigns
- [ ] Check campaign status (should be ACTIVE before testing)
- [ ] Verify pledges exist for both campaigns
- [ ] Note down pledge amounts and backer addresses

### Blockchain Verification
- [ ] Confirm campaigns are deployed on Base Sepolia
- [ ] Verify campaign deadlines have passed
- [ ] Check total pledged amounts on blockchain
- [ ] Verify goal amounts match database

## Test Case 1: Successful Campaign (test9)

### Prerequisites
- [ ] Campaign has reached or exceeded goal amount
- [ ] Deadline has passed
- [ ] Campaign status is ACTIVE
- [ ] Creator wallet is connected

### Finalize Process
- [ ] Navigate to test9 campaign page
- [ ] Verify "Finalize Campaign" button is visible (creator only)
- [ ] Click "Finalize Campaign" button
- [ ] Confirm the confirmation dialog
- [ ] Wait for transaction to complete
- [ ] Check console logs for:
  - [ ] `[v0] [CLIENT] handleFinalizeClick called`
  - [ ] `[v0] [CLIENT] Calling handleFinalize`
  - [ ] `[v0] Campaign finalized on blockchain`
  - [ ] `[v0] [SERVER ACTION] finalizeCampaignInDatabase called`
  - [ ] `[v0] [SERVER ACTION] saveFundsReleaseToDatabase called`

### Expected Results
- [ ] Transaction succeeds on blockchain
- [ ] Success toast message appears
- [ ] Campaign status updates to "FUNDED" in database
- [ ] Funds are released to creator wallet (95% of total)
- [ ] Platform fee (5%) is deducted
- [ ] Page shows "Campaign Successful!" message
- [ ] Breakdown of funds shows:
  - [ ] Total Raised
  - [ ] Platform Fee (5%)
  - [ ] Amount Received by Creator

### Database Verification
- [ ] Campaign status = "FUNDED"
- [ ] raised_amount matches blockchain total
- [ ] updated_at timestamp is recent

## Test Case 2: Failed Campaign (test10)

### Prerequisites
- [ ] Campaign has NOT reached goal amount
- [ ] Deadline has passed
- [ ] Campaign status is ACTIVE
- [ ] Creator wallet is connected

### Finalize Process
- [ ] Navigate to test10 campaign page
- [ ] Verify "Finalize Campaign" button is visible (creator only)
- [ ] Click "Finalize Campaign" button
- [ ] Confirm the confirmation dialog
- [ ] Wait for transaction to complete
- [ ] Check console logs for:
  - [ ] `[v0] [CLIENT] handleFinalizeClick called`
  - [ ] `[v0] [CLIENT] Calling handleFinalize`
  - [ ] `[v0] Campaign finalized on blockchain`
  - [ ] `[v0] [SERVER ACTION] finalizeCampaignInDatabase called`

### Expected Results
- [ ] Transaction succeeds on blockchain
- [ ] Success toast message appears
- [ ] Campaign status updates to "FAILED" in database
- [ ] Page shows "Campaign Failed" message
- [ ] Refund button appears for backers

### Database Verification
- [ ] Campaign status = "FAILED"
- [ ] raised_amount matches blockchain total
- [ ] updated_at timestamp is recent

## Test Case 3: Refund Claim (test10 backers)

### Prerequisites
- [ ] test10 campaign is finalized as FAILED
- [ ] Backer wallet is connected
- [ ] Backer has unclaimed pledge

### Refund Process
- [ ] Navigate to test10 campaign page as backer
- [ ] Verify "Claim Refund" button is visible
- [ ] Verify refund amount is displayed correctly
- [ ] Click "Claim Refund" button
- [ ] Confirm the confirmation dialog
- [ ] Wait for transaction to complete
- [ ] Check console logs for:
  - [ ] `[v0] [CLIENT] handleRefundClick called`
  - [ ] `[v0] [CLIENT] Calling handleRefund`
  - [ ] `[v0] Refund transaction confirmed`
  - [ ] `[v0] [SERVER ACTION] saveRefundToDatabase called`

### Expected Results
- [ ] Transaction succeeds on blockchain
- [ ] Success toast message appears
- [ ] Refund amount is returned to backer wallet
- [ ] Page shows "Refund Claimed" message
- [ ] "Claim Refund" button is replaced with success message

### Database Verification
- [ ] Pledge status = "REFUNDED"
- [ ] updated_at timestamp is recent
- [ ] Campaign status remains "FAILED"

## Test Case 4: Edge Cases

### Already Finalized Campaign
- [ ] Try to finalize an already finalized campaign
- [ ] Expected: Button should not be visible or disabled
- [ ] Expected: Error message if attempted

### Already Claimed Refund
- [ ] Try to claim refund again after successful claim
- [ ] Expected: Button should not be visible or show "Already Claimed"
- [ ] Expected: Error message if attempted

### Non-Creator Finalize Attempt
- [ ] Connect as non-creator wallet
- [ ] Navigate to campaign page
- [ ] Expected: "Finalize Campaign" button should not be visible

### Non-Backer Refund Attempt
- [ ] Connect as wallet that didn't pledge
- [ ] Navigate to failed campaign page
- [ ] Expected: No refund button or message saying "No pledge to refund"

## Error Scenarios

### Transaction Failures
- [ ] Insufficient gas
- [ ] Network issues
- [ ] Contract revert
- [ ] Expected: Clear error messages in UI
- [ ] Expected: Database remains unchanged

### Database Sync Failures
- [ ] Blockchain transaction succeeds but database update fails
- [ ] Expected: Error logged in console
- [ ] Expected: Manual database correction may be needed

## Post-Test Verification

### Database Consistency
- [ ] All campaign statuses are correct
- [ ] All pledge statuses are correct
- [ ] Raised amounts match blockchain
- [ ] No orphaned records

### Blockchain Consistency
- [ ] Campaign finalized status matches database
- [ ] Refund claims match database
- [ ] Fund transfers completed successfully

### User Experience
- [ ] All success/error messages are clear
- [ ] Loading states are visible during transactions
- [ ] Page updates reflect blockchain state
- [ ] No console errors (except expected ones)

## Notes

### Common Issues
- Blockchain transaction pending too long
- Database connection timeout
- Wallet connection issues
- Gas estimation failures

### Debug Commands
\`\`\`bash
# Check campaign in database
npm run dev
# Then run verify-campaigns.ts script

# Check blockchain state
# Use Base Sepolia block explorer
# Search for campaign contract address
\`\`\`

### Contact Information
- If tests fail, document:
  - Campaign ID
  - Transaction hash
  - Error messages
  - Console logs
  - Screenshots
