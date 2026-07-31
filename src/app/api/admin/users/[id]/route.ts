import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(
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

    const [user, orders] = await Promise.all([
      User.findById(id)
        .select('-password')
        .lean(),
      Order.find({ user: id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(o => o.status === 'Paid' || o.status === 'Accepted')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'Pending').length,
      refundedOrders: orders.filter(o => o.status === 'Refunded').length,
    };

    return NextResponse.json({ user, orders, stats });
  } catch (error) {
    console.error('Admin user GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}