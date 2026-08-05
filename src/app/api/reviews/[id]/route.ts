import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import { recalculateRating } from '@/lib/reviewHelpers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// PATCH — edit own review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const { id } = await params;
    let body: { rating?: number; title?: string; body?: string };
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

    await dbConnect();

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // Only the author can edit (admins can moderate via admin route)
    if (review.user.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
      }
      review.rating = body.rating;
    }
    if (body.title !== undefined) review.title = body.title.trim();
    if (body.body !== undefined) review.body = body.body.trim();

    await review.save();
    await recalculateRating(review.product.toString());

    const populated = await Review.findById(id).populate('user', 'name').lean();
    return NextResponse.json({ review: populated });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE — user deletes own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const { id } = await params;
    await dbConnect();

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const isOwner = review.user.toString() === userId;
    const isAdmin = payload.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productId = review.product.toString();
    await review.deleteOne();
    await recalculateRating(productId);

    return NextResponse.json({ message: 'Review deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}