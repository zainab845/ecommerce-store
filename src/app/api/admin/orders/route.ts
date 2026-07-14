import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Parse URL Parameters for Pagination & Filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // 10 orders per page
    const status = searchParams.get('status') || 'All';

    // Build the MongoDB Query
    const query: any = {};
    if (status !== 'All') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Fetch Paginated Orders
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get Total Count for Pagination UI
    const totalCount = await Order.countDocuments(query);

    return NextResponse.json({ 
      orders,
      pagination: {
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}