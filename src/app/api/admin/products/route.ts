import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createProduct } from '@/lib/controllers/adminController';
import { getAllProducts } from '@/lib/controllers/productController';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await getAllProducts({});
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, price, originalPrice, images, category, stock, isFeatured } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Name, description, price and category are required' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images: Array.isArray(images) ? images : [],
      category,
      stock: Number(stock) || 0,
      isFeatured: Boolean(isFeatured),
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}