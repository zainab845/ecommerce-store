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

  // --- Protect /admin routes: must be logged in as admin ---
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    const payload = await getPayload(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (payload.role !== 'admin') {
      // Logged in but not admin — send to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // --- Redirect already-logged-in users away from login/signup ---
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