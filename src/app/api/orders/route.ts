import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for the logged-in user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's order history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order (internal — called by Stripe checkout session)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, totalAmount, shippingAddress]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *               totalAmount:
 *                 type: number
 *               shippingAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Not authenticated
 */

// GET — return all orders for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    await dbConnect();

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('items totalAmount status stripePaymentIntentId refundReason createdAt')
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST — create an order (used by checkout flow)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    const { items, shippingAddress, totalAmount } = await request.json();

    await dbConnect();

    const order = await (await import('@/lib/models/Order')).default.create({
      user: userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'Pending',
    });

    return NextResponse.json(
      { orderId: order._id, message: 'Order created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}