import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// Safe Date Parser: Returns null if Stripe sends bad data
function getSafeDate(unixTimestamp: any): Date | null {
  if (typeof unixTimestamp !== 'number' || isNaN(unixTimestamp)) return null;
  const date = new Date(unixTimestamp * 1000);
  if (isNaN(date.getTime())) return null;
  return date;
}

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
      const safeDate = getSafeDate((subscription as any).current_period_end);

      const updateData: any = {
        'subscription.status': 'active',
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripeCustomerId': subscription.customer as string,
      };

      // Only attach the date to Mongoose if it is actually a valid Date object
      if (safeDate) {
        updateData['subscription.currentPeriodEnd'] = safeDate;
      }

      // Force the MongoDB update immediately
      await User.findByIdAndUpdate(userId, { $set: updateData });

      return NextResponse.json({ success: true, status: 'active' });
    }

    return NextResponse.json({ success: false, status: session.payment_status });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}