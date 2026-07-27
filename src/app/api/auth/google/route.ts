import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth login
 *     description: Redirects the user to the Google consent screen for authentication.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Optional redirect path after successful login (e.g., /settings)
 *     responses:
 *       302:
 *         description: Redirects to Google's OAuth consent screen
 */

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') || '/';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state: Buffer.from(from).toString('base64'),
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}