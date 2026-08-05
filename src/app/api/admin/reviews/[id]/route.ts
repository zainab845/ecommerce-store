import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Review from '@/lib/models/Review';
import { recalculateRating } from '@/lib/reviewHelpers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin' ? payload : null;
  } catch { return null; }
}

// PATCH — toggle visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    review.isHidden = !review.isHidden;
    await review.save();
    await recalculateRating(review.product.toString());

    return NextResponse.json({
      message: review.isHidden ? 'Review hidden' : 'Review visible',
      isHidden: review.isHidden,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE — admin deletes any review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const productId = review.product.toString();
    await review.deleteOne();
    await recalculateRating(productId);

    return NextResponse.json({ message: 'Review deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}