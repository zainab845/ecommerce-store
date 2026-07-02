import { connectToDatabase } from '../db';
import Product from '../models/Product';
import Category from '../models/Category';

export async function getAllProducts(searchParams: {
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  limit?: string;
}) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};

  if (searchParams.category) {
    const cat = await Category.findOne({ slug: searchParams.category });
    if (cat) query.category = cat._id;
  }

  if (searchParams.search) {
    query.name = { $regex: searchParams.search, $options: 'i' };
  }

  if (searchParams.featured === 'true') {
    query.isFeatured = true;
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (searchParams.sort === 'price-asc') sortOption = { price: 1 };
  if (searchParams.sort === 'price-desc') sortOption = { price: -1 };
  if (searchParams.sort === 'name') sortOption = { name: 1 };

  const limit = parseInt(searchParams.limit ?? '100');

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortOption)
    .limit(limit);

  return products;
}

export async function getProductById(id: string) {
  await connectToDatabase();
  const product = await Product.findById(id).populate('category', 'name slug');
  return product;
}

export async function getAllCategories() {
  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 });
  return categories;
}