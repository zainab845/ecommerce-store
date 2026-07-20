import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });

    // 1. Ask Stripe if the payment was actually successful
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.mode === 'subscription') {
      await dbConnect();
      
      // 2. Fetch the full subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      // 3. Force the MongoDB update immediately
      await User.findByIdAndUpdate(userId, {
        'subscription.status': 'active',
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripeCustomerId': subscription.customer as string,
        // FIX: Cast subscription as any to bypass the Response<T> wrapper typing error
        'subscription.currentPeriodEnd': new Date((subscription as any).current_period_end * 1000)
      });

      return NextResponse.json({ success: true, status: 'active' });
    }

    return NextResponse.json({ success: false, status: session.payment_status });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}