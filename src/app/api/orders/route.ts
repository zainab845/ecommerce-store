import { NextRequest, NextResponse } from 'next/server';
import Order from '@/lib/models/Order';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode token
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