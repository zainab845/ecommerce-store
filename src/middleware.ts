import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback');

async function getPayload(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; role: 'user' | 'admin' };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

// Block /api-docs in production for non-admins
if (pathname === '/api-docs') {
  if (process.env.NODE_ENV === 'production') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const payload = await getPayload(token);
    if (payload?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
}

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (token) {
        const payload = await getPayload(token);
        if (payload?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const payload = await getPayload(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── Protected user routes ─────────────────────────────────────────────────
  if (
    pathname.startsWith('/orders') ||
    pathname === '/settings'
  ) {
    if (!token) {
      const from = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
    }
    const payload = await getPayload(token);
    if (!payload) {
      const from = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
    }
    // Admins shouldn't use user-facing order/settings pages
    if (pathname.startsWith('/orders') && payload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/orders', request.url));
    }
  }

  // ── Redirect logged-in users away from login/signup ───────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      const payload = await getPayload(token);
      if (payload) {
        const dest = payload.role === 'admin' ? '/admin' : '/';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api-docs',
    '/orders/:path*',
    '/settings',
    '/login',
    '/signup',
  ],
};