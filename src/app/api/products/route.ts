import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/controllers/productController';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const products = await getAllProducts({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      featured: searchParams.get('featured') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}