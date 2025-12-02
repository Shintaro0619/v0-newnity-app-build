// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'newnity_admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 管理者クッキー
  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = adminCookie && adminCookie === process.env.ADMIN_KEY;

  // Aboutとトップページは誰でもOK
  if (pathname === '/' || pathname === '/about') {
    return NextResponse.next();
  }

  // Next.jsの静的ファイル系は誰でもOK
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // 管理者（＝自分）は全部見てOK
  if (isAdmin) {
    return NextResponse.next();
  }

  // それ以外の人は全部 /about に飛ばす
  const url = req.nextUrl.clone();
  url.pathname = '/about';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
