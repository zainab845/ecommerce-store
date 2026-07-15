import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    const userName = (payload.name as string) || 'Customer';

    if (payload.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot place orders' },
        { status: 403 }
      );
    }

    const { items, totalAmount, shippingAddress } = await request.json();
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    await dbConnect();

    // Check if user has active premium subscription
    const dbUser = await User.findById(userId).select('subscription').lean() as any;
    const isPremium = dbUser?.subscription?.status === 'active';
    const discountMultiplier = isPremium ? 0.9 : 1; // 10% off for premium

    // Recalculate actual amount with discount
    const discountedTotal = totalAmount * discountMultiplier;

    const order = await Order.create({
      user: userId,
      items,
      totalAmount: discountedTotal,
      status: 'Pending',
      shippingAddress: {
        fullName: userName,
        address: shippingAddress || 'Not provided',
        city: 'To be provided',
        phone: 'To be provided',
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
            name: item.name + (isPremium ? ' (Premium 10% off)' : ''),
            ...(item.image ? { images: [item.image] } : {}),
          },
          // Apply discount at the unit level so Stripe receipt is accurate
          unit_amount: Math.round(item.price * discountMultiplier * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { orderId: order._id.toString(), userId },
    });

    order.stripeSessionId = session.id;
    await order.save();

    return NextResponse.json({
      url: session.url,
      isPremium,
      discountApplied: isPremium,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}