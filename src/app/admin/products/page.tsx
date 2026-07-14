'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Product, Category } from '@/types';

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

const LIMIT = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [page, setPage] = useState(1);

  // Load categories once
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (stockFilter) params.set('stock', stockFilter);
      if (featuredFilter) params.set('featured', featuredFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, totalCount: 0 });
    } catch {
      showMessage('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, stockFilter, featuredFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showMessage('Product deleted', 'success');
      loadProducts();
    } catch {
      showMessage('Failed to delete product', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockFilter('');
    setFeaturedFilter('');
    setPage(1);
  };

  const hasFilters = search || categoryFilter || stockFilter || featuredFilter;

  const selectClass =
    'px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagination.totalCount} total
          </p>
        </div>
        <Link href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input type="text" placeholder="Search products..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors" />
          </div>
          <select value={categoryFilter}
            onChange={e => handleFilterChange(setCategoryFilter, e.target.value)}
            className={selectClass}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select value={stockFilter}
            onChange={e => handleFilterChange(setStockFilter, e.target.value)}
            className={selectClass}>
            <option value="">All Stock</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
          </select>
          <select value={featuredFilter}
            onChange={e => handleFilterChange(setFeaturedFilter, e.target.value)}
            className={selectClass}>
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(LIMIT)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">
            {hasFilters ? 'No products match your filters' : 'No products yet'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters}
              className="mt-3 text-sm text-indigo-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Product', 'Category', 'Price', 'Stock', 'Featured', ''].map(h => (
                    <th key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name}
                              className="w-full h-full object-cover" />
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">
                          {product.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {typeof product.category === 'object' && product.category !== null
                        ? (product.category as Category).name
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-500' :
                        product.stock < 5 ? 'text-amber-500' : 'text-green-600'
                      }`}>
                        {product.stock === 0 ? 'Out of stock' : product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.isFeatured ? (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                          Featured
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product._id}/edit`}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(product._id, product.name)}
                          disabled={deletingId === product._id}
                          className="px-3 py-1.5 text-xs font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                          {deletingId === product._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map(product => (
              <div key={product._id}
                className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name}
                        className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {typeof product.category === 'object' && product.category !== null
                        ? (product.category as Category).name : ''}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/products/${product._id}/edit`}
                    className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(product._id, product.name)}
                    disabled={deletingId === product._id}
                    className="flex-1 py-2 text-sm font-medium border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deletingId === product._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`d${idx}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p as number)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors ${
                          p === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}>
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}