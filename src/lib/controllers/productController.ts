import connectToDatabase from '../db';
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

  const query: Record<string, any> = {};

  // Category filter
  if (searchParams.category) {
    const cat = await Category.findOne({ slug: searchParams.category });
    if (cat) query.category = cat._id;
  }

  // Text search (much faster with text index)
  if (searchParams.search) {
    query.$text = { $search: searchParams.search };
  }

  // Featured products
  if (searchParams.featured === 'true') {
    query.isFeatured = true;
  }

  // Sorting
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (searchParams.sort === 'price-asc') sortOption = { price: 1 };
  if (searchParams.sort === 'price-desc') sortOption = { price: -1 };
  if (searchParams.sort === 'name') sortOption = { name: 1 };

  const limit = typeof searchParams.limit === 'number' 
    ? searchParams.limit 
    : parseInt(String(searchParams.limit ?? '12'));

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
  return Product.findById(id).populate('category', 'name slug');
}

export async function getAllCategories() {
  await connectToDatabase();
  return Category.find().sort({ name: 1 });
}