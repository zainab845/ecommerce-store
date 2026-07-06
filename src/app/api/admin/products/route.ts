import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/controllers/productController';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '12');

    const result = await getAllProducts({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      featured: searchParams.get('featured') ?? undefined,
      limit: String(limit),
      page,
    });

    // Make sure we always return consistent shape
    return NextResponse.json({
      products: Array.isArray(result.products) ? result.products : [],
      pagination: {
        page,
        totalPages: Math.ceil((result.totalCount || 0) / limit),
        totalCount: result.totalCount || 0,
      }
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch products', products: [], pagination: { page: 1, totalPages: 1, totalCount: 0 } },
      { status: 500 }
    );
  }
}