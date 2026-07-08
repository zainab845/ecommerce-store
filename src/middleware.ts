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

  // === ADMIN ROUTES ===
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

  // === USER ROUTES ===
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
    '/login', 
    '/signup',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};