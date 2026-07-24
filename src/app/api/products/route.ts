import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/controllers/productController';

// Natively cache the route for 60 seconds (Handles unique query params automatically!)
export const revalidate = 60;

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products with filtering, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term matched against product name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category slug to filter by
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price-asc, price-desc, name]
 *         description: Sort order. Default is newest first.
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true]
 *         description: Pass `true` to return only featured products
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */

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