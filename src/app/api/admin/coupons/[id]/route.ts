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
  } catch { return null; }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

    await dbConnect();
    const { id } = await params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        ...body,
        code: body.code?.toUpperCase().trim(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

    return NextResponse.json({ coupon });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Coupon deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}