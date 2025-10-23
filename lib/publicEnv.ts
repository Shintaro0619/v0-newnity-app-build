// クライアントで確実に静的展開される public 環境変数の参照口を一本化
export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? ""

if (typeof window !== "undefined") {
  // デバッグ：長さのみ出す（値は出さない）
  console.log("[v0] WC_PROJECT_ID present:", !!WC_PROJECT_ID, "len:", WC_PROJECT_ID.length)
}
