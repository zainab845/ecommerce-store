import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @swagger
 * /api/user/account:
 *   delete:
 *     tags: [User]
 *     summary: Permanently delete the user's account
 *     description: |
 *       Deletes the account, cancels any active Stripe subscription, and clears the auth cookie.
 *       - Email accounts must provide their `password`
 *       - Google-only accounts must provide `confirmation` with the exact text "delete my account"
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: For email accounts
 *               confirmation:
 *                 type: string
 *                 description: For Google-only accounts — must be "delete my account"
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Wrong password
 */

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);

    let body: { password?: string; confirmation?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(payload.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Email users must confirm with password
    if (user.authProvider !== 'google' && user.password) {
      if (!body.password) {
        return NextResponse.json(
          { error: 'Password is required to delete your account' },
          { status: 400 }
        );
      }
      const valid = await bcrypt.compare(body.password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        );
      }
    } else {
      // Google-only users confirm with text
      if (body.confirmation?.toLowerCase() !== 'delete my account') {
        return NextResponse.json(
          { error: 'Please type "delete my account" to confirm' },
          { status: 400 }
        );
      }
    }

    // Cancel active Stripe subscription if any
    if (
      user.subscription?.status === 'active' &&
      user.subscription?.stripeSubscriptionId
    ) {
      try {
        await stripe.subscriptions.cancel(
          user.subscription.stripeSubscriptionId
        );
      } catch {
        // Don't fail the deletion if Stripe errors
      }
    }

    await User.findByIdAndDelete(payload.id);

    const response = NextResponse.json({
      message: 'Account deleted successfully',
    });

    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}