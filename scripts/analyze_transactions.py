import requests
import csv
from io import StringIO
from datetime import datetime

# CSVファイルのURLを取得
csv_url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/export-token-transfer-0x77247CC270768611eb2fBc7759a7b34b9FB045Cd-aNDOvRIizWcT7P9hYKPFvRswZi1dDS.csv"

print("[v0] Fetching transaction history CSV...")
response = requests.get(csv_url)
response.raise_for_status()

# CSVデータを解析
csv_data = StringIO(response.text)
reader = csv.DictReader(csv_data)

print("\n[v0] Transaction History Analysis")
print("=" * 80)

transactions = []
for row in reader:
    transactions.append(row)

print(f"\n[v0] Total transactions found: {len(transactions)}")

# トランザクションを日付順にソート
transactions.sort(key=lambda x: x['DateTime (UTC)'])

print("\n[v0] All Transactions:")
print("-" * 80)
for i, tx in enumerate(transactions, 1):
    print(f"\n{i}. Transaction Hash: {tx['Transaction Hash']}")
    print(f"   Status: {tx['Status']}")
    print(f"   Method: {tx['Method']}")
    print(f"   DateTime: {tx['DateTime (UTC)']}")
    print(f"   From: {tx['From']}")
    print(f"   To: {tx['To']}")
    print(f"   Amount: {tx['Amount']}")
    print(f"   Token: {tx['Token']}")

# Mintトランザクションを特定
mint_txs = [tx for tx in transactions if tx['Method'] == 'Mint']
print(f"\n[v0] Mint transactions: {len(mint_txs)}")

# Transferトランザクションを特定
transfer_txs = [tx for tx in transactions if tx['Method'] == 'Transfer']
print(f"[v0] Transfer transactions: {len(transfer_txs)}")

# 送金されたトランザクションを特定（From が 0x0000... でないもの）
outgoing_txs = [tx for tx in transactions if tx['From'] != '0x0000000000000000000000000000000000000000' and tx['From'].lower() != '0x77247cc270768611eb2fbc7759a7b34b9fb045cd'.lower()]
print(f"[v0] Outgoing transactions (funds sent): {len(outgoing_txs)}")

# 受信したトランザクションを特定（To が 0x77247... のもの）
incoming_txs = [tx for tx in transactions if tx['To'].lower() == '0x77247cc270768611eb2fbc7759a7b34b9fb045cd'.lower()]
print(f"[v0] Incoming transactions (funds received): {len(incoming_txs)}")

# 合計金額を計算
total_received = sum(float(tx['Amount'].replace(',', '')) for tx in incoming_txs)
total_sent = sum(float(tx['Amount'].replace(',', '')) for tx in outgoing_txs)

print(f"\n[v0] Total received: {total_received:,.2f} USDC")
print(f"[v0] Total sent: {total_sent:,.2f} USDC")
print(f"[v0] Net balance: {total_received - total_sent:,.2f} USDC")

# test12のキャンペーンに関連するトランザクションを特定
# test12は$300をpledgeして、目標$200を達成しているので、
# クリエイターに$300が送金されているはずです
print("\n[v0] Analysis for test12 campaign:")
print("-" * 80)
print("[v0] Expected: $300 should be transferred to creator after finalize")
print("[v0] Looking for transfer transactions after finalize...")

# 最近のトランザクションを確認
recent_txs = transactions[-5:] if len(transactions) >= 5 else transactions
print(f"\n[v0] Recent transactions (last {len(recent_txs)}):")
for tx in recent_txs:
    print(f"   - {tx['DateTime (UTC)']} | {tx['Method']} | {tx['Amount']} | From: {tx['From'][:10]}... To: {tx['To'][:10]}...")

print("\n[v0] Conclusion:")
if len(outgoing_txs) == 0:
    print("   ⚠️  NO OUTGOING TRANSACTIONS FOUND")
    print("   This means funds have NOT been transferred to the creator.")
    print("   The finalize function may not be releasing funds correctly.")
else:
    print(f"   ✓ Found {len(outgoing_txs)} outgoing transaction(s)")
    print(f"   Total sent: {total_sent:,.2f} USDC")
