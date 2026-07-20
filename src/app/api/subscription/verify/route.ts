import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const parseStripeDate = (timestamp: any) => {
  if (!timestamp) return new Date(); // Fallback to now
  return new Date(timestamp * 1000);
};
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Read sessionId from the POST body
    const { sessionId } = await request.json();

    if (!sessionId) return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' && session.mode === 'subscription') {
      await dbConnect();
      
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      // Force the MongoDB update immediately
     await User.findByIdAndUpdate(userId, {
  $set: {
    'subscription.status': 'active',
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.stripeCustomerId': subscription.customer as string,
    // USE THE HELPER HERE
    'subscription.currentPeriodEnd': parseStripeDate((subscription as any).current_period_end)
  }
});

      return NextResponse.json({ success: true, status: 'active' });
    }

    return NextResponse.json({ success: false, status: session.payment_status });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}