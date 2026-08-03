import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Coupon from '@/lib/models/Coupon';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Please log in to use a coupon' }, { status: 401 });

    await jwtVerify(token, secret);

    const { code, orderAmount } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 });
    }

    await dbConnect();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    // Check expiry
    if (new Date() > coupon.expiryDate) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Minimum order of $${coupon.minOrderAmount.toFixed(2)} required for this coupon`,
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return NextResponse.json({
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
      },
      discountAmount,
      finalAmount: Math.max(0, orderAmount - discountAmount),
      message: `Coupon applied! You save $${discountAmount.toFixed(2)}`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}