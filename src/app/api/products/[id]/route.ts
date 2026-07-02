import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/controllers/productController';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Wrap params in a Promise
) {
  try {
    const resolvedParams = await params; // 2. Await the params Promise
    const product = await getProductById(resolvedParams.id); // 3. Use the resolved ID

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}