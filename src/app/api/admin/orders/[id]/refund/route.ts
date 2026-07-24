import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { pushUserNotification } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * @swagger
 * /api/admin/orders/{id}/refund:
 *   post:
 *     tags: [Admin - Orders]
 *     summary: Issue a full refund for an order
 *     description: Calls the Stripe Refunds API, sets order status to `Refunded`, saves the reason, and sends a real-time Firebase notification to the customer.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Item is out of stock
 *     responses:
 *       200:
 *         description: Refund issued
 *       400:
 *         description: No Stripe payment found, or order not in refundable state
 */


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: { reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { reason } = body;
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Refund reason is required' }, { status: 400 });
    }

    await dbConnect();

    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== 'Paid' && order.status !== 'Accepted') {
      return NextResponse.json(
        { error: 'Only paid or accepted orders can be refunded' },
        { status: 400 }
      );
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No Stripe payment found for this order' },
        { status: 400 }
      );
    }

    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    order.status = 'Refunded';
    order.refundReason = reason.trim();
    await order.save();

    // Notify the user in real-time via Firebase
    await pushUserNotification(order.user.toString(), {
      type: 'order_refunded',
      title: 'Order Refunded',
      message: `Your order #${id.slice(-8).toUpperCase()} has been refunded. Reason: ${reason.trim()}`,
      orderId: id,
    });

    return NextResponse.json({ message: 'Refund issued successfully', order });
  } catch (error: any) {
    console.error('Refund error:', error);
    if (error?.type?.startsWith('Stripe')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}