# コントラクトデプロイ手順

## 問題の概要

現在デプロイされているコントラクト（`0xBb2Ad789230E5b0a381e76dC3F3D54ec3BfAe271`）は、間違ったUSDCアドレスでデプロイされています。

- **現在のコントラクトのUSDCアドレス**: `0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB`
- **正しいBase Sepolia USDCアドレス**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

このため、`createCampaign`トランザクションが「Internal JSON-RPC error」で失敗しています。

## 解決方法：新しいコントラクトをデプロイ

### ステップ1: Remix IDEでコントラクトをデプロイ

1. **Remix IDEを開く**
   - https://remix.ethereum.org にアクセス

2. **新しいファイルを作成**
   - 左側のファイルエクスプローラーで「contracts」フォルダを右クリック
   - 「New File」を選択
   - ファイル名: `CampaignEscrow.sol`

3. **コントラクトコードをコピー**
   - `DEPLOY_NEW_CONTRACT.sol`の内容をすべてコピー
   - Remixの新しいファイルに貼り付け

4. **コンパイル**
   - 左側のメニューから「Solidity Compiler」アイコンをクリック
   - Compiler version: `0.8.20`を選択
   - 「Compile CampaignEscrow.sol」ボタンをクリック

5. **MetaMaskをBase Sepoliaに接続**
   - MetaMaskを開く
   - ネットワークを「Base Sepolia」に切り替え
   - Base Sepoliaが表示されない場合は、以下の情報で追加：
     - Network Name: Base Sepolia
     - RPC URL: https://sepolia.base.org
     - Chain ID: 84532
     - Currency Symbol: ETH
     - Block Explorer: https://sepolia.basescan.org

6. **デプロイ**
   - 左側のメニューから「Deploy & Run Transactions」アイコンをクリック
   - Environment: 「Injected Provider - MetaMask」を選択
   - Contract: 「CampaignEscrow」を選択
   - Constructor parametersに以下を入力：
     \`\`\`
     _usdcToken: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
     _platformWallet: 0x77247CC270768611eb2fBc7759a7b34b9FB045Cd
     \`\`\`
   - 「Deploy」ボタンをクリック
   - MetaMaskでトランザクションを承認

7. **コントラクトアドレスをコピー**
   - デプロイが完了したら、「Deployed Contracts」セクションに表示されるアドレスをコピー

### ステップ2: Vercelの環境変数を更新

1. **Vercelダッシュボードを開く**
   - https://vercel.com にアクセス
   - プロジェクト「Newnity app build」を選択

2. **環境変数を更新**
   - 「Settings」タブをクリック
   - 左側のメニューから「Environment Variables」を選択
   - `NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA`を見つける
   - 「Edit」をクリック
   - 新しいコントラクトアドレスを貼り付け
   - 「Save」をクリック

3. **デプロイを再実行**
   - 「Deployments」タブに戻る
   - 最新のデプロイメントの右側にある「...」メニューをクリック
   - 「Redeploy」を選択

### ステップ3: 動作確認

1. **v0プレビューをリフレッシュ**
   - ブラウザでv0のプレビューページをリフレッシュ

2. **新しいキャンペーンを作成**
   - 「Create」ページに移動
   - キャンペーン情報を入力
   - 「Create Campaign」をクリック

3. **ブロックチェーンにデプロイ**
   - キャンペーン詳細ページで「Deploy to Blockchain」ボタンをクリック
   - MetaMaskでトランザクションを承認
   - 成功すると、キャンペーンがブロックチェーンにデプロイされます

## トラブルシューティング

### エラー: "Internal JSON-RPC error"

- **原因**: USDCアドレスが間違っている、またはガスが不足している
- **解決方法**: 
  - 新しいコントラクトが正しいUSDCアドレスでデプロイされているか確認
  - MetaMaskでガス代を増やす

### エラー: "Campaign does not exist"

- **原因**: コントラクトアドレスが更新されていない
- **解決方法**: 
  - Vercelの環境変数が正しく更新されているか確認
  - デプロイを再実行

### エラー: "USDC transfer failed"

- **原因**: USDCトークンの承認（approve）が必要
- **解決方法**: 
  - Pledgeする前に、USDCトークンをコントラクトに承認する必要があります
  - アプリが自動的に承認トランザクションを要求します

## 注意事項

- **古いコントラクトのデータ**: 古いコントラクト（`0xBb2Ad789230E5b0a381e76dC3F3D54ec3BfAe271`）にデプロイされたキャンペーン（Test2など）は、新しいコントラクトでは使用できません
- **データベースのクリーンアップ**: 必要に応じて、古いキャンペーンのデータベースレコードを削除または更新してください
- **テスト**: 新しいコントラクトで小額のテストキャンペーンを作成して、すべての機能が正常に動作することを確認してください

## サポート

問題が解決しない場合は、以下の情報を提供してください：
- エラーメッセージの全文
- トランザクションハッシュ（もしあれば）
- 使用しているウォレットアドレス
- コントラクトアドレス
