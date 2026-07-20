import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { pushUserNotification } from '@/lib/firebase-admin';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

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

    await dbConnect();

    const { id } = await params;
    const order = await Order.findById(id);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== 'Paid') {
      return NextResponse.json(
        { error: 'Only paid orders can be accepted' },
        { status: 400 }
      );
    }

    order.status = 'Accepted';
    await order.save();

    // Notify the user in real-time via Firebase
    await pushUserNotification(order.user.toString(), {
      type: 'order_accepted',
      title: 'Order Accepted!',
      message: `Your order #${id.slice(-8).toUpperCase()} has been accepted and is being processed.`,
      orderId: id,
    });

    return NextResponse.json({ message: 'Order accepted successfully', order });
  } catch (error) {
    console.error('Accept order error:', error);
    return NextResponse.json({ error: 'Failed to accept order' }, { status: 500 });
  }
}