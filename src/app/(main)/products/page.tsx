'use client';

import { useState, useEffect, Suspense } from 'react';
import { Product, Category } from '@/types';

// Local environment: uncomment the next two lines when copying back to VS Code
// import Link from 'next/link';
// import { useSearchParams, useRouter } from 'next/navigation';

// Canvas environment mocks to resolve esbuild errors:
const Link = (props: any) => <a {...props} />;
const useSearchParams = () => new URLSearchParams();
const useRouter = () => ({ push: (url: string) => {} });

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? '';

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);

    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white-900 mb-8">All Products</h1>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search products..."
          defaultValue={search}
          onChange={e => updateParam('search', e.target.value)}
          className="flex-1 px-4 py-2 border border-black-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
        />
        <select
          value={category}
          onChange={e => updateParam('category', e.target.value)}
          className="px-4 py-2 border border-black-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="">Sort: Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <Link
              key={product._id}
              href={`/products/${product._id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <img
                  src={product.images[0] ?? '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-indigo-600 font-medium mb-1">
                  {typeof product.category === 'object' ? product.category.name : ''}
                </p>
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.stock === 0 && (
                    <span className="text-xs text-red-500 font-medium">Out of stock</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="text-lg font-medium text-gray-500 animate-pulse">Loading products...</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}