import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/controllers/productController';

// Natively cache the route for 60 seconds (Handles unique query params automatically!)
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const params = {
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      featured: searchParams.get('featured') ?? undefined, // Added this so the homepage filter works!
      limit: parseInt(searchParams.get('limit') ?? '12'),
      page: parseInt(searchParams.get('page') ?? '1'),
    };

    // Call your flawless controller directly
    const result = await getAllProducts(params);

    console.log(`[API /products] took ${Date.now() - start}ms`);

    return NextResponse.json({
      products: Array.isArray(result.products) ? result.products : [],
      pagination: {
        page: params.page,
        totalPages: Math.ceil((result.totalCount || 0) / params.limit),
        totalCount: result.totalCount || 0,
      }
    });
  } catch (error) {
    console.error("API Route Error:", error);
    console.log(`[API /products] failed after ${Date.now() - start}ms`);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products', 
        products: [], 
        pagination: { page: 1, totalPages: 1, totalCount: 0 } 
      },
      { status: 500 }
    );
  }
}