# CampaignEscrow デプロイガイド（Remix IDE使用）

このガイドでは、ブラウザだけでBase Sepoliaにスマートコントラクトをデプロイする方法を説明します。

## 必要なもの

1. MetaMaskウォレット
2. Base Sepolia テストネットのETH（ガス代用）
3. インターネット接続

## ステップ1: Base Sepoliaテストネットの追加

### MetaMaskにBase Sepoliaを追加

1. MetaMaskを開く
2. ネットワーク選択（上部中央）をクリック
3. 「ネットワークを追加」→「ネットワークを手動で追加」
4. 以下の情報を入力：

\`\`\`
ネットワーク名: Base Sepolia
RPC URL: https://sepolia.base.org
チェーンID: 84532
通貨記号: ETH
ブロックエクスプローラー: https://sepolia.basescan.org
\`\`\`

5. 「保存」をクリック

## ステップ2: テストETHの取得

1. https://www.coinbase.com/faucets/base-ethereum-goerli-faucet にアクセス
2. あなたのウォレットアドレスを入力
3. 「Send me ETH」をクリック
4. 数分待つと0.1 ETH程度が届きます

## ステップ3: Remix IDEでコントラクトを開く

1. https://remix.ethereum.org/ にアクセス
2. 左側の「File Explorer」タブをクリック
3. 「contracts」フォルダを右クリック → 「New File」
4. ファイル名: `CampaignEscrow.sol`
5. v0プロジェクトの `contracts/CampaignEscrow.sol` の内容をコピー&ペースト

## ステップ4: コンパイル

1. 左側の「Solidity Compiler」タブ（Sアイコン）をクリック
2. Compiler version: `0.8.20` を選択
3. 「Compile CampaignEscrow.sol」ボタンをクリック
4. 緑のチェックマークが表示されればコンパイル成功

## ステップ5: デプロイ

1. 左側の「Deploy & Run Transactions」タブ（イーサリアムアイコン）をクリック
2. ENVIRONMENT: 「Injected Provider - MetaMask」を選択
3. MetaMaskが開くので「接続」をクリック
4. ネットワークが「Base Sepolia」になっていることを確認
5. CONTRACT: 「CampaignEscrow」を選択
6. コンストラクタ引数を入力：
   - `_USDCTOKEN`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - `_PLATFORMWALLET`: あなたのウォレットアドレス
7. 「Deploy」ボタンをクリック
8. MetaMaskで「確認」をクリック
9. トランザクションが完了するまで待つ（30秒〜1分）

## ステップ6: デプロイ確認

1. Remix下部の「Deployed Contracts」セクションを確認
2. コントラクトアドレスをコピー（例: `0x1234...abcd`）
3. https://sepolia.basescan.org/address/[コントラクトアドレス] で確認

## ステップ7: コントラクトアドレスを保存

デプロイされたコントラクトアドレスを以下に記録：

\`\`\`
CampaignEscrow Contract: 0x_____________________
Network: Base Sepolia (Chain ID: 84532)
USDC Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Platform Wallet: 0x_____________________
Deployed Date: ____/____/____
\`\`\`

## ステップ8: v0に環境変数を追加

1. v0の画面右上の⚙️（設定）をクリック
2. 「Environment Variables」を選択
3. 以下の変数を追加：

\`\`\`
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x[デプロイしたアドレス]
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
\`\`\`

## トラブルシューティング

### エラー: "Insufficient funds"
→ ステップ2でテストETHを取得してください

### エラー: "Wrong network"
→ MetaMaskのネットワークが「Base Sepolia」になっているか確認

### コンパイルエラー
→ Compiler versionが0.8.20になっているか確認

### デプロイボタンが押せない
→ ENVIRONMENTが「Injected Provider - MetaMask」になっているか確認

## 次のステップ

デプロイが完了したら、フロントエンドとの統合に進みます。
コントラクトアドレスを保存しておいてください。
