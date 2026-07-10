import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    const userName = (payload.name as string) || 'Customer';

    const { items, totalAmount } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    await dbConnect();

    // Create order in DB first with Pending status
    // Order becomes Paid only after webhook confirms payment
    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      status: 'Pending',
      shippingAddress: {
        fullName: userName,
        address: 'To be provided',
        city: 'To be provided',
        phone: 'To be provided',
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session — Stripe hosts the payment page
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: {
        name: string;
        price: number;
        quantity: number;
        image?: string;
      }) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      // {CHECKOUT_SESSION_ID} is a Stripe template variable — it fills in automatically
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    // Save session ID so we can look up the order from webhook
    order.stripeSessionId = session.id;
    await order.save();

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}