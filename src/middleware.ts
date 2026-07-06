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

  // Skip middleware for the admin login page itself
  if (pathname === '/admin/login') {
    // If already logged in as admin, redirect to dashboard
    if (token) {
      const payload = await getPayload(token);
      if (payload?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const payload = await getPayload(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (payload.role !== 'admin') {
      // Logged in as regular user — send to store home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect logged-in users away from /login and /signup
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
  matcher: ['/admin/:path*', '/login', '/signup'],
};