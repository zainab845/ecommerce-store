import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createCategory } from '@/lib/controllers/adminController';
import { getAllCategories } from '@/lib/controllers/productController';

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: Get all categories
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All categories
 *   post:
 *     tags: [Admin - Categories]
 *     summary: Create a new category
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, image } = await request.json();
    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });

    const category = await createCategory({ name, description, image });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}