import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { pushNotification } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await dbConnect();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'payment') {
        // One-time order payment 
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
        // ── Subscription payment 
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}