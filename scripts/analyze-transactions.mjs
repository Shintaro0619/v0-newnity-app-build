import fetch from 'node-fetch';

async function analyzeTransactions() {
  try {
    console.log('[v0] Fetching transaction CSV...');
    const response = await fetch('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/export-token-transfer-0x77247CC270768611eb2fBc7759a7b34b9FB045Cd-aNDOvRIizWcT7P9hYKPFvRswZi1dDS.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('[v0] CSV fetched successfully');
    
    // Parse CSV
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    console.log('[v0] CSV Headers:', headers);
    console.log('[v0] Total transactions:', lines.length - 1);
    
    // Parse transactions
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const tx = {
        hash: values[0],
        status: values[1],
        method: values[2],
        blockNo: values[3],
        dateTime: values[4],
        from: values[5],
        fromNametag: values[6],
        to: values[7],
        toNametag: values[8],
        amount: values[9],
        valueUSD: values[10],
        token: values[11]
      };
      transactions.push(tx);
    }
    
    console.log('\n[v0] ===== TRANSACTION ANALYSIS =====\n');
    
    // Analyze transactions
    const walletAddress = '0x77247CC270768611eb2fBc7759a7b34b9FB045Cd';
    const mintTxs = transactions.filter(tx => tx.method === 'Mint');
    const transferTxs = transactions.filter(tx => tx.method !== 'Mint');
    const outgoingTxs = transactions.filter(tx => 
      tx.from.toLowerCase() === walletAddress.toLowerCase()
    );
    const incomingTxs = transactions.filter(tx => 
      tx.to.toLowerCase() === walletAddress.toLowerCase()
    );
    
    console.log('[v0] Total Transactions:', transactions.length);
    console.log('[v0] Mint Transactions:', mintTxs.length);
    console.log('[v0] Transfer Transactions:', transferTxs.length);
    console.log('[v0] Outgoing Transactions:', outgoingTxs.length);
    console.log('[v0] Incoming Transactions:', incomingTxs.length);
    
    console.log('\n[v0] ===== MINT TRANSACTIONS =====\n');
    mintTxs.forEach(tx => {
      console.log(`[v0] ${tx.dateTime} | ${tx.amount} | To: ${tx.to}`);
    });
    
    console.log('\n[v0] ===== OUTGOING TRANSACTIONS =====\n');
    outgoingTxs.forEach(tx => {
      console.log(`[v0] ${tx.dateTime} | ${tx.amount} | From: ${tx.from} | To: ${tx.to} | Method: ${tx.method}`);
    });
    
    console.log('\n[v0] ===== INCOMING TRANSACTIONS =====\n');
    incomingTxs.forEach(tx => {
      console.log(`[v0] ${tx.dateTime} | ${tx.amount} | From: ${tx.from} | To: ${tx.to} | Method: ${tx.method}`);
    });
    
    // Calculate totals
    const totalIncoming = incomingTxs.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount.replace(/,/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const totalOutgoing = outgoingTxs.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount.replace(/,/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log('\n[v0] ===== SUMMARY =====\n');
    console.log(`[v0] Total Incoming: ${totalIncoming.toLocaleString()} USDC`);
    console.log(`[v0] Total Outgoing: ${totalOutgoing.toLocaleString()} USDC`);
    console.log(`[v0] Net Balance: ${(totalIncoming - totalOutgoing).toLocaleString()} USDC`);
    
    // Check for test12 campaign (300 USDC)
    console.log('\n[v0] ===== TEST12 CAMPAIGN ANALYSIS =====\n');
    const test12Amount = 300;
    const matchingTxs = outgoingTxs.filter(tx => {
      const amount = parseFloat(tx.amount.replace(/,/g, ''));
      return amount === test12Amount;
    });
    
    if (matchingTxs.length > 0) {
      console.log(`[v0] Found ${matchingTxs.length} transaction(s) matching test12 amount (${test12Amount} USDC):`);
      matchingTxs.forEach(tx => {
        console.log(`[v0] ${tx.dateTime} | ${tx.amount} | To: ${tx.to} | Hash: ${tx.hash}`);
      });
    } else {
      console.log(`[v0] ⚠️ NO transactions found matching test12 amount (${test12Amount} USDC)`);
      console.log('[v0] This suggests the funds have NOT been released to the creator.');
    }
    
  } catch (error) {
    console.error('[v0] Error analyzing transactions:', error);
  }
}

analyzeTransactions();
