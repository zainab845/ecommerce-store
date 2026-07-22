'use client';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, Category } from '@/types';

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isPremium } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [error, setError] = useState<string | null>(null);

  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  // Load categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Load products whenever URL params change
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '12');

    fetch(`/api/products?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`API error: ${r.status}`);
        }
        const d = await r.json();
        
        // Robust handling - ensure products is always an array
        const receivedProducts = Array.isArray(d.products) ? d.products : [];
        const receivedPagination = d.pagination ?? { page: 1, totalPages: 1, totalCount: 0 };

        setProducts(receivedProducts);
        setPagination(receivedPagination);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
        setError(err.message || 'Failed to load products');
        setProducts([]);           // Ensure it's an array on error
        setPagination({ page: 1, totalPages: 1, totalCount: 0 });
      })
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  // Debounce search input
  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    if (searchInput === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      params.delete('page'); // reset to page 1 ONLY on new search
      router.push(`/products?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, searchParams, router]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset to page 1 when filter changes
    router.push(`/products?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/products?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
        {!loading && !error && (
          <p className="text-sm text-gray-500">{pagination.totalCount} products</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={category}
          onChange={e => updateParam('category', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
        >
          <option value="">Sort: Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}. Please try again.
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : error || products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-lg font-medium text-gray-500">
            {error ? 'Something went wrong' : 'No products found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {error ? 'Please check your connection and try again' : 'Try a different search or category'}
          </p>
          {(search || category || error) && (
            <button
              onClick={() => {
                setSearchInput('');
                router.push('/products');
                setError(null);
              }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
  const isLocked = product.isPremiumOnly && !isPremium;
  return isLocked ? (
    // Locked premium product card
    <div key={product._id}
      className="relative group bg-white rounded-2xl overflow-hidden border border-gray-100">
      {/* Blurred preview */}
      <div className="aspect-square bg-gray-50 overflow-hidden filter blur-[2px]">
        <img
          src={product.images?.[0] ?? '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="font-bold text-gray-900 text-sm">Premium Only</p>
        <p className="text-xs text-gray-500 mt-1 text-center px-4">{product.name}</p>
        <Link href="/subscription"
          className="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          Upgrade to unlock
        </Link>
      </div>
    </div>
  ) : (
    // Normal product card
    <Link key={product._id} href={`/products/${product._id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0] ?? '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-indigo-600 font-medium">
            {typeof product.category === 'object' && product.category !== null
              ? product.category.name : 'Uncategorized'}
          </p>
          {product.isPremiumOnly && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">
              Premium
            </span>
          )}
        </div>
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-600">
                  ${(product.price * 0.9).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
            )}
          </div>
          {product.stock === 0 && (
            <span className="text-xs text-red-500 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  );
})}
        </div>
      )}

      {/* Pagination - Always visible when there are products */}
      {!loading && !error && pagination.totalCount > 0 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => {
                // Show first, last, current, and nearby pages
                if (p === 1 || p === pagination.totalPages) return true;
                if (Math.abs(p - pagination.page) <= 1) return true;
                return false;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 py-2 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors ${
                      p === pagination.page
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-lg font-medium text-gray-400 animate-pulse">Loading products...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}