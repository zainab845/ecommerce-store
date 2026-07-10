import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// --- POST: Create a new order ---
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    const { items, shippingAddress, totalAmount } = await request.json();

    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'Pending'
    });

    return NextResponse.json({ 
      orderId: order._id,
      message: 'Order placed successfully. Waiting for admin approval.' 
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

// --- GET: Fetch logged-in user's orders ---
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}