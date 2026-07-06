import connectToDatabase from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// --- Products ---
export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock: number;
  isFeatured: boolean;
}) {
  await connectToDatabase();
  const slug = toSlug(data.name);
  return await Product.create({ ...data, slug });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    images: string[];
    category: string;
    stock: number;
    isFeatured: boolean;
  }>
) {
  await connectToDatabase();
  const update: typeof data & { slug?: string } = { ...data };
  if (data.name) update.slug = toSlug(data.name);
  return await Product.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteProduct(id: string) {
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
}

// --- Categories ---
export async function createCategory(data: {
  name: string;
  description?: string;
  image?: string;
}) {
  await connectToDatabase();
  const slug = toSlug(data.name);
  return await Category.create({ ...data, slug });
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; image: string }>
) {
  await connectToDatabase();
  const update: typeof data & { slug?: string } = { ...data };
  if (data.name) update.slug = toSlug(data.name);
  return await Category.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteCategory(id: string) {
  await connectToDatabase();
  await Category.findByIdAndDelete(id);
}