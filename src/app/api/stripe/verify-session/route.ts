import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve session from Stripe to get our orderId from metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await dbConnect();

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}