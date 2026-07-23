import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const userId = request.headers.get('x-user-id'); 
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId).lean();
    
    if (!user || !user.subscription?.stripeCustomerId) {
      return NextResponse.json({ status: 'free' });
    }

    // 1. Fetch the active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: user.subscription.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ status: 'inactive' });
    }

    const sub: any = subscriptions.data[0];
    
    // 2. Extract the price directly from the subscription object 
    
    const amountInCents = sub.items?.data?.[0]?.price?.unit_amount || 999;
    const currency = sub.items?.data?.[0]?.price?.currency || 'usd';

    return NextResponse.json({
      status: sub.status,
      planName: 'Premium',
      amount: amountInCents / 100, // Convert cents to dollars
      currency: currency,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });

  } catch (error) {
    console.error('Stripe Details Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}