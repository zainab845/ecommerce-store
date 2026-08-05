import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = 10;
    const filter = searchParams.get('filter') ?? 'all'; // all | hidden | visible | low-rating

    const query: Record<string, unknown> = {};
    if (filter === 'hidden') query.isHidden = true;
    if (filter === 'visible') query.isHidden = false;
    if (filter === 'low-rating') query.rating = { $lte: 2 };

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email')
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}