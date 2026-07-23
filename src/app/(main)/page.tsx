import Link from 'next/link';
import { Product, Category } from '@/types';

// Force Next.js to NEVER cache this page so it always shows fresh data
export const dynamic = 'force-dynamic'; 

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Change to 'no-store' to bypass cache
    const res = await fetch(
      `${baseUrl}/api/products?featured=true&limit=20`,
      { cache: 'no-store' } 
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    const products = Array.isArray(data?.products) ? data.products : [];
    
    // STRICT FRONTEND FILTER: Force it to only return items where isFeatured is true
    // (This guarantees it works even if the API route ignores the query param)
    return products.filter((p: any) => p.isFeatured === true).slice(0, 8);
    
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const res = await fetch(
      `${baseUrl}/api/categories`,
      { cache: 'no-store' } // Bypass cache here too
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    return Array.isArray(data?.categories) ? data.categories : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Discover Amazing
            <span className="text-indigo-600"> Products</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Shop the latest trends with fast delivery, easy returns, and
            unbeatable prices.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="px-8 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-square flex items-end p-4 hover:shadow-md transition-shadow"
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 w-full">
                    <p className="font-semibold text-gray-900 text-sm">
                      {cat.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No products yet.</p>
              <p className="text-sm mt-1">
                Add some products through the admin panel and mark them as featured.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    <img
                      src={product.images[0] ?? '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Optional: Add a featured badge visually */}
                    <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Featured
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}