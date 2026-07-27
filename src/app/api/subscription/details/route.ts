import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * @swagger
 * /api/subscription/details:
 *   get:
 *     summary: Retrieves active subscription details
 *     description: Fetches the current Stripe subscription status, renewal date, and upcoming invoice amount for the logged-in user.
 *     tags:
 *       - Subscription
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: The internal MongoDB ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 planName:
 *                   type: string
 *                   example: "Premium"
 *                 amount:
 *                   type: number
 *                   example: 9.99
 *                 currency:
 *                   type: string
 *                   example: "usd"
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *                 cancelAtPeriodEnd:
 *                   type: boolean
 *       401:
 *         description: Unauthorized (Missing x-user-id)
 *       500:
 *         description: Internal Server Error
 */

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

    // 3. SAFELY handle the date. If Stripe omits it, fallback gracefully.
    const periodEndTimestamp = sub.current_period_end;
    const safePeriodEnd = typeof periodEndTimestamp === 'number' 
      ? new Date(periodEndTimestamp * 1000).toISOString() 
      : new Date().toISOString(); // Fallback to current date to prevent crashes

    return NextResponse.json({
      status: sub.status,
      planName: 'Premium',
      amount: amountInCents / 100, // Convert cents to dollars
      currency: currency,
      currentPeriodEnd: safePeriodEnd,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end, // Force boolean
    });

  } catch (error) {
    console.error('Stripe Details Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}