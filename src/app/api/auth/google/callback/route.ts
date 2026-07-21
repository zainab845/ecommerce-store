import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let from = '/';
  try {
    if (state) from = Buffer.from(state, 'base64').toString('utf-8');
  } catch {}

  // User cancelled or error from Google
  if (error || !code) {
    return NextResponse.redirect(
      new URL('/login?error=google_cancelled', request.url)
    );
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(
        new URL('/login?error=google_auth_failed', request.url)
      );
    }

    const { access_token } = await tokenRes.json();

    // 2. Get user info from Google
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        new URL('/login?error=google_auth_failed', request.url)
      );
    }

    const googleUser = await userInfoRes.json();
    const {
      sub: googleId,
      email,
      name,
      email_verified,
    } = googleUser as {
      sub: string;
      email: string;
      name: string;
      email_verified: boolean;
    };

    if (!email_verified) {
      return NextResponse.redirect(
        new URL('/login?error=email_not_verified', request.url)
      );
    }

    await dbConnect();

    // 3. Find or create user
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Existing user — link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === 'email' ? 'both' : 'google';
        await user.save();
      }
    } else {
      // New user — create via Google
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase().trim(),
        googleId,
        authProvider: 'google',
        role: 'user',
        // No password field for pure Google accounts
      });
    }

    // Admins cannot log in via Google on the user login flow
    if (user.role === 'admin') {
      return NextResponse.redirect(
        new URL('/login?error=admin_use_email', request.url)
      );
    }

    // 4. Create JWT and set cookie
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.redirect(new URL(from, baseUrl));
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}