import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { productId, stock } = await request.json();

    if (!productId || stock === undefined || stock < 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findByIdAndUpdate(
      productId,
      { stock: Number(stock) },
      { new: true }
    ).select('name stock');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}