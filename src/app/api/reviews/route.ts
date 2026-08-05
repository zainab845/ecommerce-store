import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import Order from '@/lib/models/Order';
import { recalculateRating } from '@/lib/reviewHelpers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// GET — all reviews for a product
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const sort = searchParams.get('sort') ?? 'newest'; // newest | highest | lowest | helpful

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1 };

    const ratingFilter = searchParams.get('rating');
    const query: Record<string, unknown> = { product: productId, isHidden: false };
    if (ratingFilter) query.rating = parseInt(ratingFilter);

    const reviews = await Review.find(query)
      .populate('user', 'name')
      .sort(sortOption)
      .lean();

    // Rating distribution (1–5 star counts)
    const distribution = await Review.aggregate([
      { $match: { product: new (require('mongoose').Types.ObjectId)(productId), isHidden: false } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d: any) => { dist[d._id] = d.count; });

    return NextResponse.json({ reviews, distribution: dist });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST — create a review
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to write a review' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    let body: { productId: string; orderId: string; rating: number; title?: string; body?: string };
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

    const { productId, orderId, rating, title, body: reviewBody } = body;

    if (!productId || !orderId || !rating) {
      return NextResponse.json(
        { error: 'productId, orderId and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await dbConnect();

    // Verify the user has an accepted order containing this product
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: 'Accepted',
      'items.product': productId,
    }).lean();

    if (!order) {
      return NextResponse.json(
        { error: 'You can only review products from completed orders that have been accepted.' },
        { status: 403 }
      );
    }

    // One review per user per product
    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product. You can edit your existing review.' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      order: orderId,
      rating,
      title: title?.trim() ?? '',
      body: reviewBody?.trim() ?? '',
    });

    await recalculateRating(productId);

    const populated = await Review.findById(review._id).populate('user', 'name').lean();
    return NextResponse.json({ review: populated }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}