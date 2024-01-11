// import { NextRequest, NextResponse } from 'next/server';

// export default async function middleware(req: NextRequest) {
//   const path = req.nextUrl.pathname;
//   const session = !!req.cookies.get("next-auth.session-token")

//   if (!session) {
//     return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${path}`, req.url));
//   }
//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//     '/boards',
//     '/chat/:path*'
//   ]
// }

import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });
  const isAuthenticated = !!token;

  if ( (path.startsWith('/api/auth/signin') || path.startsWith('/auth/login')) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const authMiddleware = await withAuth({
    pages: {
      signIn: '/auth/login'
    },
  });
  // @ts-expect-error
  return authMiddleware(req, event);
}