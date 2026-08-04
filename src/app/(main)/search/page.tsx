'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: { name: string; slug: string } | string;
  stock: number;
  isPremiumOnly: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name', label: 'Name: A–Z' },
];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isPremium } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Local price inputs — only pushed to URL when "Apply" is clicked
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  // Sync local price state when URL params change
  useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [minPrice, maxPrice]);

  // Load categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []));
  }, []);

  // Fetch products on any URL param change
  const fetchProducts = useCallback(async () => {
    if (!q) {
      setProducts([]);
      setPagination({ page: 1, totalPages: 1, totalCount: 0 });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('search', q);
      params.set('page', String(page));
      params.set('limit', '12');
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setPagination(
        data.pagination ?? { page: 1, totalPages: 1, totalCount: 0 }
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete('page');
    router.push(`/search?${p.toString()}`);
  };

  const applyPriceFilter = () => {
    const p = new URLSearchParams(searchParams.toString());
    if (priceMin) p.set('minPrice', priceMin);
    else p.delete('minPrice');
    if (priceMax) p.set('maxPrice', priceMax);
    else p.delete('maxPrice');
    p.delete('page');
    router.push(`/search?${p.toString()}`);
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    setPriceMin('');
    setPriceMax('');
  };

  const goToPage = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(newPage));
    router.push(`/search?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = category || sort || minPrice || maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile / standalone search bar on the search page */}
      <div className="mb-6 max-w-2xl">
        <SearchBar
          placeholder={q ? `Search "${q}"...` : 'Search products...'}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          {q ? (
            <>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Results for{' '}
                <span className="text-indigo-600">&quot;{q}&quot;</span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading
                  ? 'Searching...'
                  : `${pagination.totalCount} product${pagination.totalCount !== 1 ? 's' : ''} found`}
              </p>
            </>
          ) : (
            <h1 className="text-xl font-extrabold text-gray-900">
              Search Products
            </h1>
          )}
        </div>

        {/* Sort — visible inline on desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-gray-500 flex-shrink-0">Sort:</span>
          <select
            value={sort}
            onChange={e => updateParam('sort', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-60 flex-shrink-0">
          {/* Mobile toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 mb-4"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
              Filters
              {hasFilters && (
                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            className={`space-y-4 ${filtersOpen ? 'block' : 'hidden'} lg:block`}
          >
            {/* Category */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Category
              </h3>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={!category}
                    onChange={() => updateParam('category', '')}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
                    All Categories
                  </span>
                </label>
                {categories.map(cat => (
                  <label
                    key={cat._id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat.slug}
                      onChange={() => updateParam('category', cat.slug)}
                      className="text-indigo-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Price Range
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  to
                </span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <button
                onClick={applyPriceFilter}
                className="w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply Price Filter
              </button>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                    const p = new URLSearchParams(searchParams.toString());
                    p.delete('minPrice');
                    p.delete('maxPrice');
                    router.push(`/search?${p.toString()}`);
                  }}
                  className="w-full mt-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear price filter
                </button>
              )}
            </div>

            {/* Sort — mobile only */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:hidden">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Sort By
              </h3>
              <div className="space-y-2.5">
                {SORT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === opt.value}
                      onChange={() => updateParam('sort', opt.value)}
                      className="text-indigo-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear all */}
            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full py-2.5 border border-red-100 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!q ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="w-16 h-16 text-gray-200 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-400">
                What are you looking for?
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Use the search bar above to find products
              </p>
              <Link
                href="/products"
                className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
              >
                Browse all products →
              </Link>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-2xl aspect-square animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="w-16 h-16 text-gray-200 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-500">
                No results found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Try different keywords or clear your filters
              </p>
              {hasFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {products.map(product => {
                  const isLocked = product.isPremiumOnly && !isPremium;
                  const catName =
                    typeof product.category === 'object' &&
                    product.category !== null
                      ? product.category.name
                      : '';
                  const discount = product.originalPrice
                    ? Math.round(
                        (1 - product.price / product.originalPrice) * 100
                      )
                    : 0;
                  const displayPrice = isPremium
                    ? product.price * 0.9
                    : product.price;

                  return (
                    <Link
                      key={product._id}
                      href={
                        isLocked
                          ? '/subscription'
                          : `/products/${product._id}`
                      }
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        <img
                          src={product.images?.[0] ?? '/placeholder.png'}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isLocked ? 'blur-sm' : ''}`}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.stock === 0 && (
                            <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          )}
                          {discount > 0 && product.stock > 0 && (
                            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                              -{discount}%
                            </span>
                          )}
                          {product.isPremiumOnly && (
                            <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                              Premium
                            </span>
                          )}
                        </div>
                        {isLocked && (
                          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-xs font-semibold text-indigo-700 bg-white px-3 py-1.5 rounded-lg shadow">
                              🔒 Premium Only
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs text-indigo-600 font-medium mb-0.5">
                          {catName}
                        </p>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          {isPremium && !isLocked ? (
                            <>
                              <span className="font-bold text-emerald-600 text-sm">
                                ${displayPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-gray-900 text-sm">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.originalPrice && (
                                <span className="text-xs text-gray-400 line-through">
                                  ${product.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}