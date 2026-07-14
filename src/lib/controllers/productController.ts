import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';

export async function getAllProducts(searchParams: {
  category?: string;
  search?: string;
  sort?: string;
  featured?: string;
  limit?: string | number;
  page?: number;
}) {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (searchParams.category) {
    // .lean() makes this 2-3x faster — returns plain JS object not Mongoose document
    const cat = await Category.findOne({ slug: searchParams.category }).select('_id').lean();
    if (!cat) return { products: [], totalCount: 0 }; // Unknown category → empty result fast
    query.category = cat._id;
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

  const limit =
    typeof searchParams.limit === 'number'
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
      // Only fetch fields needed for the listing — skips description, reviewCount etc.
      .select('name price originalPrice images category stock isFeatured')
      .lean(), // ← KEY OPTIMIZATION: plain objects instead of Mongoose documents
    Product.countDocuments(query),
  ]);

  return { products, totalCount };
}

export async function getProductById(id: string) {
  await dbConnect();
  return Product.findById(id).populate('category', 'name slug').lean();
}

export async function getAllCategories() {
  await dbConnect();
  return Category.find().sort({ name: 1 }).lean();
}