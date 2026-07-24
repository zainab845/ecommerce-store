import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Stripe requires absolute https:// URLs under 2048 characters.
// Reject relative paths (/placeholder.png), base64 strings, http:// URLs,
// and anything over the length limit — just omit the image rather than crash.
function safeStripeImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.length > 2048) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/stripe/checkout-session:
 *   post:
 *     tags: [Stripe]
 *     summary: Create a Stripe Checkout Session for a product order
 *     description: |
 *       Creates an order in MongoDB with status `Pending`, then creates a Stripe hosted checkout session.
 *       Premium users automatically get a 10% discount applied at the unit price level.
 *       Redirects the user to `NEXT_PUBLIC_APP_URL/checkout/success` on payment success.
 *       Product image URLs must be absolute `https://` URLs under 2048 characters — relative paths are silently omitted.
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
 *                     image:
 *                       type: string
 *               totalAmount:
 *                 type: number
 *               shippingAddress:
 *                 type: string
 *                 description: Full readable address from reverse geocoding
 *     responses:
 *       200:
 *         description: Stripe Checkout URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 isPremium:
 *                   type: boolean
 *                 discountApplied:
 *                   type: boolean
 *       403:
 *         description: Admin accounts cannot place orders
 */

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    const userName = (payload.name as string) || 'Customer';

    if (payload.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot place orders' },
        { status: 403 }
      );
    }

    let body: { items: any[]; totalAmount: number; shippingAddress: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { items, totalAmount, shippingAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    await dbConnect();

    // Check premium status for discount
    const dbUser = await User.findById(userId).select('subscription').lean() as any;
    const isPremium = dbUser?.subscription?.status === 'active';
    const discountMultiplier = isPremium ? 0.9 : 1;

    const discountedTotal = totalAmount; // frontend already sends the discounted total

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
      }) => {
        const validImage = safeStripeImageUrl(item.image);
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              // Only attach images if the URL passes Stripe's requirements
              ...(validImage ? { images: [validImage] } : {}),
            },
            unit_amount: Math.round(item.price * discountMultiplier * 100),
          },
          quantity: item.quantity,
        };
      }),
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
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
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}