import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    const userEmail = payload.email as string;

    if (payload.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot subscribe' },
        { status: 403 }
      );
    }

    await dbConnect();
    const user = await User.findById(userId).lean() as any;

    if (user?.subscription?.status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active Premium subscription' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      // Pass userId so webhook can find the user
      metadata: { userId, userEmail },
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
      subscription_data: {
        metadata: { userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Failed to create subscription session' }, { status: 500 });
  }
}