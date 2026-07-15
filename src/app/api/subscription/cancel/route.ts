import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    await dbConnect();
    const user = await User.findById(userId).lean() as any;

    if (!user?.subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel at period end so user keeps access until they paid for
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      message: 'Subscription will be cancelled at the end of your billing period.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}