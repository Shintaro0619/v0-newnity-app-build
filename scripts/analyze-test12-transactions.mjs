import fetch from 'node-fetch'

const CSV_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/export-token-transfer-0x77247CC270768611eb2fBc7759a7b34b9FB045Cd-aNDOvRIizWcT7P9hYKPFvRswZi1dDS.csv'

// test12のキャンペーン情報
const TEST12_INFO = {
  campaignId: 8,
  pledgedAmount: 300, // USDC
  goalAmount: 200, // USDC
  platformFeePercent: 5, // 5%
  expectedCreatorAmount: 300 * 0.95, // 285 USDC
  expectedPlatformFee: 300 * 0.05, // 15 USDC
}

console.log('[v0] ===== TEST12 CAMPAIGN DETAILED ANALYSIS =====\n')
console.log('[v0] Campaign Info:')
console.log(`[v0]   Campaign ID: ${TEST12_INFO.campaignId}`)
console.log(`[v0]   Pledged Amount: ${TEST12_INFO.pledgedAmount} USDC`)
console.log(`[v0]   Goal Amount: ${TEST12_INFO.goalAmount} USDC`)
console.log(`[v0]   Platform Fee: ${TEST12_INFO.platformFeePercent}%`)
console.log(
  `[v0]   Expected Creator Amount: ${TEST12_INFO.expectedCreatorAmount} USDC`
)
console.log(
  `[v0]   Expected Platform Fee: ${TEST12_INFO.expectedPlatformFee} USDC\n`
)

try {
  const response = await fetch(CSV_URL)
  const csvText = await response.text()

  const lines = csvText.split('\n')
  const headers = lines[0].split(',')

  console.log('[v0] CSV Headers:', headers.join(', '), '\n')

  const transactions = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    const values = lines[i].split(',')
    const tx = {
      hash: values[0]?.replace(/"/g, ''),
      status: values[1]?.replace(/"/g, ''),
      method: values[2]?.replace(/"/g, ''),
      blockNo: values[3]?.replace(/"/g, ''),
      dateTime: values[4]?.replace(/"/g, ''),
      from: values[5]?.replace(/"/g, ''),
      to: values[6]?.replace(/"/g, ''),
      amount: values[9]?.replace(/"/g, ''),
      token: values[11]?.replace(/"/g, ''),
    }
    transactions.push(tx)
  }

  console.log(`[v0] Total Transactions: ${transactions.length}\n`)

  // 285 USDC（クリエイターへの送金）を探す
  console.log('[v0] ===== SEARCHING FOR 285 USDC (Creator Amount) =====')
  const creatorTransfers = transactions.filter(
    (tx) =>
      tx.amount.includes('285') ||
      tx.amount === '285' ||
      tx.amount === '285.0' ||
      tx.amount === '285.00'
  )

  if (creatorTransfers.length > 0) {
    console.log(`[v0] ✅ Found ${creatorTransfers.length} transaction(s) with 285 USDC:`)
    creatorTransfers.forEach((tx, index) => {
      console.log(`[v0]   Transaction ${index + 1}:`)
      console.log(`[v0]     Hash: ${tx.hash}`)
      console.log(`[v0]     Status: ${tx.status}`)
      console.log(`[v0]     Method: ${tx.method}`)
      console.log(`[v0]     DateTime: ${tx.dateTime}`)
      console.log(`[v0]     From: ${tx.from}`)
      console.log(`[v0]     To: ${tx.to}`)
      console.log(`[v0]     Amount: ${tx.amount}`)
      console.log(`[v0]     Token: ${tx.token}\n`)
    })
  } else {
    console.log('[v0] ❌ No transactions found with 285 USDC\n')
  }

  // 15 USDC（プラットフォーム手数料）を探す
  console.log('[v0] ===== SEARCHING FOR 15 USDC (Platform Fee) =====')
  const platformFeeTransfers = transactions.filter(
    (tx) =>
      tx.amount.includes('15') &&
      !tx.amount.includes('150') &&
      !tx.amount.includes('115') &&
      !tx.amount.includes('215')
  )

  if (platformFeeTransfers.length > 0) {
    console.log(
      `[v0] ✅ Found ${platformFeeTransfers.length} transaction(s) with ~15 USDC:`
    )
    platformFeeTransfers.forEach((tx, index) => {
      console.log(`[v0]   Transaction ${index + 1}:`)
      console.log(`[v0]     Hash: ${tx.hash}`)
      console.log(`[v0]     Status: ${tx.status}`)
      console.log(`[v0]     Method: ${tx.method}`)
      console.log(`[v0]     DateTime: ${tx.dateTime}`)
      console.log(`[v0]     From: ${tx.from}`)
      console.log(`[v0]     To: ${tx.to}`)
      console.log(`[v0]     Amount: ${tx.amount}`)
      console.log(`[v0]     Token: ${tx.token}\n`)
    })
  } else {
    console.log('[v0] ❌ No transactions found with ~15 USDC\n')
  }

  // 300 USDC（Pledge金額）を探す
  console.log('[v0] ===== SEARCHING FOR 300 USDC (Pledge Amount) =====')
  const pledgeTransfers = transactions.filter(
    (tx) =>
      tx.amount.includes('300') &&
      !tx.amount.includes('3000') &&
      !tx.amount.includes('1300')
  )

  if (pledgeTransfers.length > 0) {
    console.log(`[v0] ✅ Found ${pledgeTransfers.length} transaction(s) with 300 USDC:`)
    pledgeTransfers.forEach((tx, index) => {
      console.log(`[v0]   Transaction ${index + 1}:`)
      console.log(`[v0]     Hash: ${tx.hash}`)
      console.log(`[v0]     Status: ${tx.status}`)
      console.log(`[v0]     Method: ${tx.method}`)
      console.log(`[v0]     DateTime: ${tx.dateTime}`)
      console.log(`[v0]     From: ${tx.from}`)
      console.log(`[v0]     To: ${tx.to}`)
      console.log(`[v0]     Amount: ${tx.amount}`)
      console.log(`[v0]     Token: ${tx.token}\n`)
    })
  } else {
    console.log('[v0] ❌ No transactions found with 300 USDC\n')
  }

  // すべてのトランザクションを日付順に表示
  console.log('[v0] ===== ALL TRANSACTIONS (CHRONOLOGICAL) =====')
  transactions.forEach((tx, index) => {
    console.log(`[v0] ${index + 1}. ${tx.dateTime} | ${tx.method} | ${tx.amount} | ${tx.status}`)
    console.log(`[v0]    From: ${tx.from}`)
    console.log(`[v0]    To: ${tx.to}`)
    console.log(`[v0]    Hash: ${tx.hash}\n`)
  })

  // 結論
  console.log('[v0] ===== CONCLUSION =====')
  if (creatorTransfers.length > 0) {
    console.log(
      '[v0] ✅ Funds appear to have been released to the creator (285 USDC found)'
    )
  } else if (pledgeTransfers.length > 0) {
    console.log(
      '[v0] ⚠️ Pledge transaction found (300 USDC), but no release transaction (285 USDC)'
    )
    console.log('[v0] This suggests the finalize transaction may have failed internally')
  } else {
    console.log('[v0] ❌ No transactions found related to test12 campaign')
    console.log(
      '[v0] Possible reasons:'
    )
    console.log('[v0]   1. CSV file is outdated and does not include recent transactions')
    console.log('[v0]   2. Transactions are from a different wallet address')
    console.log('[v0]   3. Campaign has not been finalized yet')
  }
} catch (error) {
  console.error('[v0] Error analyzing transactions:', error)
}
