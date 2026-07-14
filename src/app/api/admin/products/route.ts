import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/controllers/productController';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

//Fetch all products
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

//POST: Create a new product 
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    // Generate a URL-friendly slug from the name
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Create the product in the database
    const newProduct = await Product.create({ ...body, slug });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("Add Product Error:", error);
    // Handle duplicate slug/name errors from MongoDB gracefully
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A product with this name already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}