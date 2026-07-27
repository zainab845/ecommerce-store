import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * @swagger
 * /api/user/password:
 *   patch:
 *     tags: [User]
 *     summary: Change the user's password
 *     description: Requires the current password for email accounts. Google-only accounts can set a password without providing a current one.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Required for email-authenticated accounts
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Current password incorrect
 */

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);

    let body: { currentPassword?: string; newPassword?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(payload.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Google-only accounts have no password — let them set one directly
    if (user.authProvider !== 'google') {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { error: 'No password set for this account' },
          { status: 400 }
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    user.password = await bcrypt.hash(newPassword, 12);
    // If they're setting a password on a Google account, mark as 'both'
    if (user.authProvider === 'google') {
      user.authProvider = 'both';
    }
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}