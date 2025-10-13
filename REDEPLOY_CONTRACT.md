# コントラクト再デプロイ手順

## ✅ 完了: 新しいコントラクトがデプロイされました

新しいEscrowコントラクトアドレス: **`0x6C52550E28152404c03f36089f9f652304C2AB51`**

### 完了した作業

1. ✅ 新しいコントラクトをRemix IDEでデプロイ
2. ✅ Vercelの環境変数`NEXT_PUBLIC_ESCROW_VAULT_BASE_SEPOLIA`を更新
3. ✅ Vercelで再デプロイを実行
4. ✅ コードベース内のすべての参照を更新

### 更新されたファイル

- `lib/contracts/contract-addresses.ts` - デフォルトアドレスを新しいコントラクトに更新
- `lib/wagmi.ts` - ESCROW_VAULTアドレスを更新
- `app/test/page.tsx` - テストページのアドレスを更新
- `app/test/usdc-diagnostic/page.tsx` - 診断ページのアドレスを更新
- `app/test/verify-contract/page.tsx` - 検証ページのアドレスを更新
- `app/test/direct-deploy/page.tsx` - 直接デプロイページのアドレスを更新

## 次のステップ: テストと確認

### 1. Vercelの再デプロイが完了するまで待つ

Vercelダッシュボードで再デプロイのステータスを確認してください。完了したら次に進みます。

### 2. v0プレビューをリフレッシュ

ブラウザでv0のプレビューページをハードリフレッシュしてください：
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + F5`

### 3. 診断テストを実行

`/test`ページに移動し、「Run Full Diagnostic」ボタンを押してください。以下を確認：

- ✅ Mock USDCコントラクトが存在する
- ✅ Escrowコントラクトが存在する
- ✅ USDCアドレスが一致する
- ✅ createCampaignシミュレーションが成功する
- ✅ Next Campaign ID = 1（新しいコントラクトなので0から開始）

### 4. 新しいキャンペーンを作成

1. `/create`ページに移動
2. キャンペーン情報を入力
3. 「Create Campaign」をクリック
4. キャンペーン詳細ページで「Deploy to Blockchain」をクリック
5. MetaMaskでトランザクションを承認

**期待される結果**: トランザクションが成功し、キャンペーンがブロックチェーンにデプロイされる

### 5. Pledgeをテスト

1. デプロイされたキャンペーンのページに移動
2. 「Get Involved」ボタンをクリック
3. Pledge金額を入力
4. トランザクションを承認

**期待される結果**: Pledgeが成功し、キャンペーンの進捗が更新される

## 重要な注意事項

### 新しいコントラクトの特徴

- **Owner**: あなたのウォレットアドレス（`0x77247CC270768611eb2fBc7759a7b34b9FB045Cd`）
- **USDC Address**: Mock USDC（`0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB`）
- **Platform Wallet**: あなたのウォレットアドレス
- **Next Campaign ID**: 1（新しいコントラクトなので0から開始）

### 古いコントラクトのデータ

- 古いコントラクト（`0xBb2Ad789230E5b0a381e76dC3F3D54ec3BfAe271`）のCampaign 1は新しいコントラクトには存在しません
- データベース内の古いキャンペーンは、`onChainId`がnullのままになります
- 必要に応じて、古いキャンペーンのデータベースレコードを削除または更新してください

## トラブルシューティング

### エラー: "Contract does not exist"

**原因**: Vercelの再デプロイがまだ完了していない、またはブラウザキャッシュが古い

**解決方法**:
1. Vercelダッシュボードで再デプロイが完了していることを確認
2. ブラウザのキャッシュをクリア
3. ページをハードリフレッシュ

### エラー: "USDC address mismatch"

**原因**: 新しいコントラクトが間違ったUSDCアドレスでデプロイされた

**解決方法**:
1. `/test/verify-contract`ページで「Verify Contract」を実行
2. `usdcToken`が`0xC08b4C06eBd87DF46c28B620E71463bd7567F9bB`であることを確認
3. 異なる場合は、正しいUSDCアドレスで新しいコントラクトを再デプロイ

### エラー: "createCampaign simulation failed"

**原因**: コントラクトコードに問題がある、またはパラメータが無効

**解決方法**:
1. `/test/verify-contract`ページで「Run Parameter Tests」を実行
2. どのパラメータが動作するかを確認
3. 必要に応じて、コントラクトコードを修正して再デプロイ

### エラー: "Transaction failed"

**原因**: ガス不足、またはコントラクトのrequire文が失敗

**解決方法**:
1. MetaMaskでガス代を増やす
2. コンソールログでエラーメッセージを確認
3. `/test/direct-deploy`ページで高いガスリミット（1000000）で試す

## 成功の確認

すべてが正常に動作している場合：

- ✅ 診断テストがすべて成功
- ✅ キャンペーンの作成とデプロイが成功
- ✅ Pledgeが成功し、進捗が更新される
- ✅ Backer数が正しく表示される

これらが確認できたら、MVPの提出準備が整いました！
