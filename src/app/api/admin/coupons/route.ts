import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Coupon from '@/lib/models/Coupon';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

    const { code, type, value, minOrderAmount, maxDiscount, expiryDate, usageLimit } = body;

    if (!code || !type || !value || !expiryDate) {
      return NextResponse.json({ error: 'Code, type, value and expiry date are required' }, { status: 400 });
    }

    if (type === 'percentage' && (value <= 0 || value > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 });
    }

    if (type === 'fixed' && value <= 0) {
      return NextResponse.json({ error: 'Fixed discount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 0,
      isActive: true,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}