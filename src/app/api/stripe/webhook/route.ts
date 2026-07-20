import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { pushNotification } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Safe Date Parser: Returns null if Stripe sends bad data
function getSafeDate(unixTimestamp: any): Date | null {
  if (typeof unixTimestamp !== 'number' || isNaN(unixTimestamp)) return null;
  const date = new Date(unixTimestamp * 1000);
  if (isNaN(date.getTime())) return null;
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    // ── checkout.session.completed ──────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Product Order
      if (session.mode === 'payment') {
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const order = await Order.findByIdAndUpdate(
            orderId,
            {
              status: 'Paid',
              stripePaymentIntentId: session.payment_intent as string,
            },
            { new: true }
          );

          const amount = order?.totalAmount
            ? `$${order.totalAmount.toFixed(2)}`
            : `$${((session.amount_total ?? 0) / 100).toFixed(2)}`;

          await pushNotification({
            type: 'new_order',
            title: 'New Order Received',
            message: `${amount} — ready for review`,
            orderId,
          });
        }
      }

      // Subscription Order
      if (session.mode === 'subscription') {
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const safeDate = getSafeDate((subscription as any).current_period_end);

          const updateData: any = {
            'subscription.status': 'active',
            'subscription.stripeSubscriptionId': subscriptionId,
            'subscription.stripeCustomerId': customerId,
          };

          // Only attach the date to Mongoose if it is actually a valid Date object
          if (safeDate) {
            updateData['subscription.currentPeriodEnd'] = safeDate;
          }

          await User.findByIdAndUpdate(userId, { $set: updateData });
          console.log(`[webhook] User ${userId} activated Premium`);
        }
      }
    }

    // ── customer.subscription.created ───────────────────────────────────────
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      
      if (userId) {
        const safeDate = getSafeDate((subscription as any).current_period_end);
        
        const updateData: any = {
          'subscription.status': 'active',
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.stripeCustomerId': subscription.customer as string,
        };

        if (safeDate) {
          updateData['subscription.currentPeriodEnd'] = safeDate;
        }

        await User.findByIdAndUpdate(userId, { $set: updateData });
      }
    }

    // ── customer.subscription.updated ───────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const mappedStatus =
        subscription.status === 'active' ? 'active' :
        subscription.status === 'past_due' ? 'past_due' :
        'cancelled';

      const safeDate = getSafeDate((subscription as any).current_period_end);

      const updateData: any = {
        'subscription.status': mappedStatus,
      };

      if (safeDate) {
        updateData['subscription.currentPeriodEnd'] = safeDate;
      }

      await User.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': subscription.id },
        { $set: updateData }
      );
    }

    // ── customer.subscription.deleted ───────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await User.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': subscription.id },
        { $set: { 'subscription.status': 'cancelled' } }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}