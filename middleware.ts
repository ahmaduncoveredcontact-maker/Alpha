import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminSession, getClientSession } from '@/lib/auth/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  const publicPaths = [
    '/admin-login',
    '/api/auth/admin/login',
    '/api/auth/admin/logout',
    '/api/auth/client/login',
    '/api/auth/client/logout',
    '/api/webhook/new-lead',
    '/api/vapi/webhook',
    '/api/reviews/check',
  ];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  // Admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!getAdminSession() && !isPublic) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    return NextResponse.next();
  }

  // Client dashboard routes
  if (pathname.startsWith('/live/') && pathname.includes('/dashboard')) {
    const parts = pathname.split('/');
    if (parts.length >= 3) {
      const slug = parts[2];
      if (slug && !getClientSession(slug) && !isPublic) {
        return NextResponse.redirect(new URL(`/live/${slug}`, request.url));
      }
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Live login pages are public
  if (pathname.startsWith('/live/') && !pathname.includes('/dashboard')) {
    return NextResponse.next();
  }

  // r/[slug] public redirect
  if (pathname.startsWith('/r/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|public).*)',
};