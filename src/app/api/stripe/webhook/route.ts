import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { pushNotification } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // ── checkout.session.completed — covers BOTH payment and subscription ─────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'payment') {
        // ── One-time product order ──────────────────────────────────────────
        const orderId = session.metadata?.orderId;
        if (!orderId) return NextResponse.json({ received: true });

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

      if (session.mode === 'subscription') {
        // ── Subscription payment — most reliable place to activate ──────────
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && subscriptionId) {
          // Fetch full subscription to get period_end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await User.findByIdAndUpdate(userId, {
            'subscription.status': 'active',
            'subscription.stripeSubscriptionId': subscriptionId,
            'subscription.stripeCustomerId': customerId,
            'subscription.currentPeriodEnd': new Date(
              (subscription as any).current_period_end * 1000
            ),
          });

          console.log(`[webhook] User ${userId} activated Premium via checkout.session.completed`);
        }
      }
    }

    // ── customer.subscription.created — backup activation ────────────────────
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) return NextResponse.json({ received: true });

      await User.findByIdAndUpdate(userId, {
        'subscription.status': 'active',
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripeCustomerId': subscription.customer as string,
        'subscription.currentPeriodEnd': new Date(
          (subscription as any).current_period_end * 1000
        ),
      });

      console.log(`[webhook] User ${userId} activated via customer.subscription.created`);
    }

    // ── customer.subscription.updated — renewals and status changes ───────────
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      const mappedStatus =
        subscription.status === 'active' ? 'active' :
        subscription.status === 'past_due' ? 'past_due' :
        'cancelled';

      await User.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': subscription.id },
        {
          'subscription.status': mappedStatus,
          'subscription.currentPeriodEnd': new Date(
            (subscription as any).current_period_end * 1000
          ),
        }
      );
    }

    // ── customer.subscription.deleted — final cancellation ────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await User.findOneAndUpdate(
        { 'subscription.stripeSubscriptionId': subscription.id },
        { 'subscription.status': 'cancelled' }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}