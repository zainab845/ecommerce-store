'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReviewProduct {
  _id: string;
  name: string;
  images?: string[];
}

interface ReviewUser {
  _id: string;
  name: string;
  email: string;
}

interface Review {
  _id: string;
  product: ReviewProduct;
  user: ReviewUser;
  rating: number;
  title: string;
  body: string;
  isHidden: boolean;
  createdAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), filter });
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, totalCount: 0 });
    } catch {
      showToast('Failed to load reviews', false);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleHide = async (review: Review) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review._id}`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, true);
        load();
      } else showToast(data.error, false);
    } catch { showToast('Failed', false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this review?')) return;
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      showToast('Review deleted', true);
      load();
    } catch { showToast('Failed', false); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pagination.totalCount} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Reviews' },
            { value: 'visible', label: 'Visible' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'low-rating', label: '⭐ 1–2 Stars' },
          ].map(f => (
            <button key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>{toast.text}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No reviews found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review._id}
                className={`bg-white rounded-2xl border p-5 ${review.isHidden ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Product thumbnail */}
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {review.product?.images?.[0] ? (
                        <img src={review.product.images[0]} alt={review.product.name}
                          className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-600 font-medium truncate">{review.product?.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={review.rating} />
                        {review.isHidden && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">HIDDEN</span>
                        )}
                      </div>
                      {review.title && <p className="text-sm font-semibold text-gray-900 mt-1">{review.title}</p>}
                      {review.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{review.body}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        By <span className="font-medium">{review.user?.name}</span> ({review.user?.email}) ·{' '}
                        {new Date(review.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleHide(review)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        review.isHidden
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'border border-amber-100 text-amber-600 hover:bg-amber-50'
                      }`}>
                      {review.isHidden ? 'Show' : 'Hide'}
                    </button>
                    <button onClick={() => handleDelete(review._id)}
                      className="px-3 py-1.5 text-xs font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}