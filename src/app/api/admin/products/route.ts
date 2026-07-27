import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     tags: [Admin - Products]
 *     summary: Get all products with admin filters and pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ObjectId
 *       - in: query
 *         name: stock
 *         schema:
 *           type: string
 *           enum: [instock, outofstock]
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Paginated products list
 *       401:
 *         description: Not authenticated as admin
 *   post:
 *     tags: [Admin - Products]
 *     summary: Create a new product
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, category]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               originalPrice:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 description: Category ObjectId
 *               stock:
 *                 type: integer
 *               isFeatured:
 *                 type: boolean
 *               isPremiumOnly:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error or duplicate name
 */

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') ?? '';
    const categoryId = searchParams.get('category') ?? '';
    const stockFilter = searchParams.get('stock') ?? '';
    const featuredFilter = searchParams.get('featured') ?? '';

    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (categoryId) query.category = categoryId;
    if (stockFilter === 'instock') query.stock = { $gt: 0 };
    if (stockFilter === 'outofstock') query.stock = 0;
    if (featuredFilter === 'true') query.isFeatured = true;
    if (featuredFilter === 'false') query.isFeatured = false;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    console.error('Admin GET products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body — could not parse JSON' }, { status: 400 });
    }

    const { name, description, price, originalPrice, images, category, stock, isFeatured } = body as {
      name?: string;
      description?: string;
      price?: number;
      originalPrice?: number;
      images?: string | string[];
      category?: string;
      stock?: number;
      isFeatured?: boolean;
    };

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Name, description, price and category are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify category exists
    const categoryExists = await Category.findById(category).lean();
    if (!categoryExists) {
      return NextResponse.json({ error: 'Selected category does not exist' }, { status: 400 });
    }

    const slug = toSlug(name as string);

    // Handle images — textarea gives newline-separated string OR array
    const imageArray = Array.isArray(images)
      ? images.filter(Boolean)
      : typeof images === 'string'
      ? images.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images: imageArray,
      category,
      stock: Number(stock) || 0,
      isFeatured: Boolean(isFeatured),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Admin POST product error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A product with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}