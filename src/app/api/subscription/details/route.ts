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

    const subscriptions = await stripe.subscriptions.list({
      customer: user.subscription.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ status: 'inactive' });
    }

    // Cast to 'any' to bypass strict TS checking for the newer Stripe SDK version
    const sub: any = subscriptions.data[0];
    
    const upcomingInvoice: any = await (stripe.invoices as any).retrieveUpcoming({
      customer: user.subscription.stripeCustomerId,
    });

    return NextResponse.json({
      status: sub.status,
      planName: 'Premium',
      amount: upcomingInvoice.amount_due / 100,
      currency: upcomingInvoice.currency,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });

  } catch (error) {
    console.error('Stripe Details Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}