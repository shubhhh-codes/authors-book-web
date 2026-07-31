import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSessionToken } from '@/lib/adminAuth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page and auth API endpoint without session
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next();
  }

  // 2. Cryptographically verify admin session cookie & HMAC signature
  const sessionToken = request.cookies.get('ab_admin_session')?.value;
  const isValidAdmin = await verifyAdminSessionToken(sessionToken);

  // 3. Protect /admin routes
  if (pathname.startsWith('/admin') && !isValidAdmin) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Protect /api/admin routes
  if (pathname.startsWith('/api/admin') && !isValidAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized access. Cryptographic admin token verification failed.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
