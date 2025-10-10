# 環境変数の修正が必要

## 問題

`NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA` 環境変数が本物のUSDCアドレス（0x036CbD53842c5426634e7929541eC2318f3dCF7e）に設定されており、コードのデフォルト値を上書きしています。

## 解決方法

### オプション1: 環境変数を削除（推奨）

1. v0の左サイドバーで「Vars」をクリック
2. `NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA` を探す
3. この環境変数を削除

コードのデフォルト値（0xf6a99087519a7D86899aA73Eba522DF8FDD47121）が使用されます。

### オプション2: 環境変数を正しい値に更新

1. v0の左サイドバーで「Vars」をクリック
2. `NEXT_PUBLIC_MOCK_USDC_BASE_SEPOLIA` を探す
3. 値を `0xf6a99087519a7D86899aA73Eba522DF8FDD47121` に変更

## 確認

環境変数を削除または更新した後：
1. ページをリロード
2. `/test` ページにアクセス
3. 緑色の「Mock USDC Ready」メッセージが表示されるはず
4. 「Mint 1000 USDC」ボタンが有効になるはず

## デバッグ

コンソールログで以下を確認：
\`\`\`
[v0] USDC Address Check: {
  "usdcAddress": "0xf6a99087519a7D86899aA73Eba522DF8FDD47121",
  "isMockUSDC": true,
  "isRealUSDC": false,
  "chainId": 84532
}
\`\`\`

`isMockUSDC: true` になっていれば成功です。
