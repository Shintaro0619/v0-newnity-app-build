import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_COOKIE_NAME = "newnity_admin"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value
  const adminKey = process.env.ADMIN_KEY
  const isAdmin = Boolean(adminKey && adminCookie && adminCookie === adminKey)

  // ルートと /about は誰でも見られる
  if (pathname === "/" || pathname === "/about") {
    return NextResponse.next()
  }

  // Next.js の内部パスや静的ファイル、favicon、画像、API はそのまま通す
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next()
  }

  // 管理者だけ他のページを見られる
  if (isAdmin) {
    return NextResponse.next()
  }

  // それ以外のユーザーはすべて /about にリダイレクト
  const url = req.nextUrl.clone()
  url.pathname = "/about"
  url.search = ""
  return NextResponse.redirect(url)
}

// すべての通常ルートに middleware を適用（静的ファイルなどは除外）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
