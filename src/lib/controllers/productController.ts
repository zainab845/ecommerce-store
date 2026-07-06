import { connectToDatabase } from '../db';
import Product from '../models/Product';
import Category from '../models/Category';

export async function getAllProducts(searchParams: {
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  limit?: string | number;
  page?: number;
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

  const limit = typeof searchParams.limit === 'number'
    ? searchParams.limit
    : parseInt(searchParams.limit ?? '12');
  const page = searchParams.page ?? 1;
  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('name slug price originalPrice images category stock isFeatured'),
    Product.countDocuments(query),
  ]);

  return { products, totalCount };
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