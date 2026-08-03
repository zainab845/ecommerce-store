import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

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

    const [lowStock, outOfStock] = await Promise.all([
      Product.find({ stock: { $gt: 0, $lte: 5 } })
        .select('name stock images')
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
      Product.find({ stock: 0 })
        .select('name stock images')
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({ lowStock, outOfStock });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}