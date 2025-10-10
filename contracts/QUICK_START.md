# クイックスタート: 5分でデプロイ

## 最速デプロイ手順

### 1. MetaMask準備（1分）
- Base Sepoliaネットワークを追加
- テストETHを取得: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 2. Remixでデプロイ（3分）
1. https://remix.ethereum.org/ を開く
2. `CampaignEscrow.sol` をコピー&ペースト
3. コンパイル（Compiler: 0.8.20）
4. デプロイ:
   - Environment: Injected Provider
   - USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Platform Wallet: あなたのアドレス
5. 「Deploy」→ MetaMaskで確認

### 3. アドレスをコピー（1分）
- Deployed Contractsからアドレスをコピー
- v0の環境変数に追加:
  \`\`\`
  NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
  \`\`\`

完了！次はフロントエンド統合です。
