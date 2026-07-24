import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @swagger
 * /api/stripe/verify-session:
 *   get:
 *     tags: [Stripe]
 *     summary: Verify a Stripe checkout session and return the linked order
 *     description: Called by the `/checkout/success` page after Stripe redirects the user back. Retrieves the session from Stripe, finds the order by the session's metadata, and returns it.
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe Checkout Session ID (format cs_test_...)
 *     responses:
 *       200:
 *         description: Order linked to this session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found for this session
 */

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