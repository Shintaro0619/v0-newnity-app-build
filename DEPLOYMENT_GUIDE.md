# CampaignEscrow デプロイガイド（公式Base Sepolia USDC使用）

このガイドでは、**正しいUSDCアドレス**を使用してBase Sepoliaにスマートコントラクトをデプロイする方法を説明します。

## 📋 デプロイ情報まとめ

### 使用するアドレス

\`\`\`
USDC Token (Base Sepolia): 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Platform Wallet: 0x77247CC270768611eb2fBc7759a7b34b9FB045Cd
Network: Base Sepolia
Chain ID: 84532
\`\`\`

### コンストラクタ引数（コピー用）

\`\`\`
0x036CbD53842c5426634e7929541eC2318f3dCF7e,0x77247CC270768611eb2fBc7759a7b34b9FB045Cd
\`\`\`

---

## ステップ1: Remix IDEを開く

1. https://remix.ethereum.org/ にアクセス
2. 左側の「File Explorer」タブをクリック

## ステップ2: コントラクトファイルを作成

1. 「contracts」フォルダを右クリック → 「New File」
2. ファイル名: `CampaignEscrow.sol`
3. v0プロジェクトの `contracts/CampaignEscrow_DEPLOY_THIS.sol` の内容を**全てコピー&ペースト**

## ステップ3: コンパイル

1. 左側の「Solidity Compiler」タブ（Sアイコン）をクリック
2. **Compiler version: `0.8.20`** を選択
3. 「Compile CampaignEscrow.sol」ボタンをクリック
4. ✅ 緑のチェックマークが表示されればコンパイル成功

## ステップ4: MetaMaskの準備

### Base Sepoliaネットワークを追加（まだの場合）

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

### テストETHの取得（残高が少ない場合）

1. https://www.coinbase.com/faucets/base-ethereum-goerli-faucet にアクセス
2. あなたのウォレットアドレスを入力
3. 「Send me ETH」をクリック

## ステップ5: デプロイ

1. 左側の「Deploy & Run Transactions」タブ（イーサリアムアイコン）をクリック
2. **ENVIRONMENT: 「Injected Provider - MetaMask」を選択**
3. MetaMaskが開くので「接続」をクリック
4. **ネットワークが「Base Sepolia」になっていることを確認**
5. **CONTRACT: 「CampaignEscrow」を選択**
6. **コンストラクタ引数を入力**（下の入力欄に以下をコピー&ペースト）：

\`\`\`
0x036CbD53842c5426634e7929541eC2318f3dCF7e,0x77247CC270768611eb2fBc7759a7b34b9FB045Cd
\`\`\`

7. 🚀 **「Deploy」ボタンをクリック**
8. MetaMaskで「確認」をクリック
9. トランザクションが完了するまで待つ（30秒〜1分）

## ステップ6: デプロイ確認

1. Remix下部の「Deployed Contracts」セクションを確認
2. **コントラクトアドレスをコピー**（例: `0x1234...abcd`）
3. https://sepolia.basescan.org/address/[コントラクトアドレス] で確認

## ステップ7: コントラクトアドレスを記録

デプロイされたコントラクトアドレスを以下に記録：

\`\`\`
✅ CampaignEscrow Contract: 0x_____________________
✅ Network: Base Sepolia (Chain ID: 84532)
✅ USDC Token: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
✅ Platform Wallet: 0x77247CC270768611eb2fBc7759a7b34b9FB045Cd
✅ Deployed Date: ____/____/____
\`\`\`

## ステップ8: v0チャットでコントラクトアドレスを報告

デプロイが完了したら、v0チャットで以下のように報告してください：

\`\`\`
デプロイ完了しました。
新しいコントラクトアドレス: 0x[あなたのアドレス]
\`\`\`

v0が自動的に環境変数を更新し、アプリケーションを新しいコントラクトに接続します。

---

## 🔧 トラブルシューティング

### ❌ エラー: "Insufficient funds"
→ ステップ4でテストETHを取得してください

### ❌ エラー: "Wrong network"
→ MetaMaskのネットワークが「Base Sepolia」になっているか確認

### ❌ コンパイルエラー
→ Compiler versionが **0.8.20** になっているか確認

### ❌ デプロイボタンが押せない
→ ENVIRONMENTが「Injected Provider - MetaMask」になっているか確認

### ❌ コンストラクタ引数のエラー
→ 引数が正しくコピーされているか確認（カンマで区切られた2つのアドレス）

---

## 📝 重要な注意事項

1. **必ず公式Base Sepolia USDCアドレスを使用**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
2. **古いコントラクトは使用しない**: 以前のコントラクト（`0xBb2Ad789...`）は間違ったUSDCアドレスを使用しているため、使用できません
3. **コントラクトアドレスを保存**: デプロイ後のアドレスは必ず記録してください

---

## 次のステップ

デプロイが完了したら、v0チャットで新しいコントラクトアドレスを報告してください。
v0が自動的にアプリケーションを更新します。
