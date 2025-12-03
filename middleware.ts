// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "newnity_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const adminKey = process.env.ADMIN_KEY;
  const isAdmin = Boolean(adminKey && adminCookie && adminCookie === adminKey);

  // Next.js の内部ファイルや API は常に通す
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // 管理者はすべてのページOK
  if (isAdmin) {
    return NextResponse.next();
  }

  // 一般ユーザーが直接アクセスしてOKなのは /about だけ
  if (pathname === "/about") {
    return NextResponse.next();
  }

  // それ以外（"/" を含む全ルート）は /about にリダイレクト
  const url = req.nextUrl.clone();
  url.pathname = "/about";
  url.search = "";
  return NextResponse.redirect(url);
}

// staticファイルなどを除いてすべてに適用
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
