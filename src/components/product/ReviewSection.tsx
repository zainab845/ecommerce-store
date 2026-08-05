'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Review {
  _id: string;
  user: { _id: string; name: string };
  rating: number;
  title: string;
  body: string;
  helpfulCount: number;
  createdAt: string;
}

interface ReviewFormData {
  rating: number;
  title: string;
  body: string;
  orderId: string;
}

interface EligibleOrder {
  _id: string;
  createdAt: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <svg
            className={`w-8 h-8 transition-colors ${
              s <= (hover || value) ? 'text-amber-400' : 'text-gray-200'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500 self-center">
        {hover || value ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hover || value] : 'Select rating'}
      </span>
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 24 24"
        >
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

interface Props {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

export default function ReviewSection({ productId, averageRating, reviewCount }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({1:0,2:0,3:0,4:0,5:0});
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({ rating: 0, title: '', body: '', orderId: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // My review
  const myReview = user ? reviews.find(r => r.user._id === user.id) : null;

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ productId, sort });
      if (ratingFilter) params.set('rating', ratingFilter);
      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setDistribution(data.distribution ?? {1:0,2:0,3:0,4:0,5:0});
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadReviews(); }, [productId, sort, ratingFilter]);

  // Load eligible orders when user wants to write a review
  const openWriteForm = async () => {
    setFormError('');
    setFormSuccess('');
    if (!user) { setShowForm(true); return; }

    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const accepted = (data.orders ?? []).filter(
        (o: any) => o.status === 'Accepted' && o.items.some((i: any) => i.product === productId || i.product?._id === productId)
      );
      setEligibleOrders(accepted);
      if (accepted.length > 0) {
        setFormData(prev => ({ ...prev, orderId: accepted[0]._id }));
      }
    } catch {}

    setShowForm(true);
  };

  const openEditForm = (review: Review) => {
    setEditingReviewId(review._id);
    setFormData({ rating: review.rating, title: review.title, body: review.body, orderId: '' });
    setFormError('');
    setFormSuccess('');
    setShowForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.rating) { setFormError('Please select a star rating'); return; }

    setFormLoading(true);
    try {
      let res: Response;

      if (editingReviewId) {
        res = await fetch(`/api/reviews/${editingReviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: formData.rating, title: formData.title, body: formData.body }),
        });
      } else {
        if (!formData.orderId) { setFormError('Please select an order'); setFormLoading(false); return; }
        res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, orderId: formData.orderId, rating: formData.rating, title: formData.title, body: formData.body }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setFormSuccess(editingReviewId ? 'Review updated!' : 'Review submitted!');
      setShowForm(false);
      setEditingReviewId(null);
      setFormData({ rating: 0, title: '', body: '', orderId: '' });
      loadReviews();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      loadReviews();
    } catch {}
  };

  const totalReviews = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10">
        {/* Overall rating */}
        <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-2xl px-8 py-6 min-w-[160px]">
          <span className="text-5xl font-extrabold text-indigo-600">
            {averageRating > 0 ? averageRating.toFixed(1) : '—'}
          </span>
          <StarDisplay rating={averageRating} size="md" />
          <p className="text-xs text-gray-500 mt-1">
            {reviewCount} review{reviewCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution[star] ?? 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <button
                key={star}
                onClick={() => setRatingFilter(ratingFilter === String(star) ? '' : String(star))}
                className={`w-full flex items-center gap-3 group transition-opacity ${ratingFilter && ratingFilter !== String(star) ? 'opacity-40' : ''}`}
              >
                <span className="text-xs text-gray-500 w-4 flex-shrink-0">{star}</span>
                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Write review CTA */}
        <div className="flex flex-col items-center justify-center gap-3 min-w-[160px]">
          {myReview ? (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Your review</p>
              <StarDisplay rating={myReview.rating} size="md" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => openEditForm(myReview)}
                  className="text-xs text-indigo-600 hover:underline">Edit</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => handleDelete(myReview._id)}
                  className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ) : (
            <button
              onClick={openWriteForm}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Write a Review
            </button>
          )}
          {formSuccess && (
            <p className="text-xs text-green-600 font-medium text-center">{formSuccess}</p>
          )}
        </div>
      </div>

      {/* Write / Edit Review Form */}
      {showForm && (
        <div className="mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
          </h3>

          {!user ? (
            <p className="text-sm text-gray-500">
              Please <a href="/login" className="text-indigo-600 hover:underline font-medium">sign in</a> to write a review.
            </p>
          ) : !editingReviewId && eligibleOrders.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 font-medium">You can only review products you have purchased and received.</p>
              <p className="text-xs text-gray-400 mt-1">Purchase this product and wait for your order to be accepted to leave a review.</p>
              <button onClick={() => setShowForm(false)} className="mt-3 text-sm text-indigo-600 hover:underline">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Order selector — only for new reviews */}
              {!editingReviewId && eligibleOrders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Order
                  </label>
                  <select
                    value={formData.orderId}
                    onChange={e => setFormData(p => ({ ...p, orderId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-indigo-400 bg-white"
                  >
                    {eligibleOrders.map(o => (
                      <option key={o._id} value={o._id}>
                        Order #{o._id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <StarInput value={formData.rating} onChange={r => setFormData(p => ({ ...p, rating: r }))} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title</label>
                <input type="text" placeholder="Summarize your experience"
                  maxLength={100} value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review</label>
                <textarea rows={4} placeholder="Share your experience with this product..."
                  maxLength={2000} value={formData.body}
                  onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors resize-none" />
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.body.length}/2000</p>
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">{formError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={formLoading}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                  {formLoading ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                </button>
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingReviewId(null); setFormError(''); }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sort / filter controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400">
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
        {ratingFilter && (
          <button onClick={() => setRatingFilter('')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg">
            ★ {ratingFilter} only
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-gray-400 font-medium">
            {ratingFilter ? `No ${ratingFilter}-star reviews yet` : 'No reviews yet'}
          </p>
          <p className="text-xs text-gray-300 mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map(review => {
            const isOwn = user?.id === review.user._id;
            const dateStr = new Date(review.createdAt).toLocaleDateString('en-US', {
              day: 'numeric', month: 'long', year: 'numeric',
            });

            return (
              <div key={review._id}
                className={`bg-white border rounded-2xl p-5 ${isOwn ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                        {isOwn && (
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-gray-400">{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner actions */}
                  {isOwn && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEditForm(review)}
                        className="text-xs text-indigo-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => handleDelete(review._id)}
                        className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                    </div>
                  )}
                </div>

                {review.title && (
                  <p className="mt-3 font-semibold text-gray-900 text-sm">{review.title}</p>
                )}
                {review.body && (
                  <p className="mt-1.5 text-gray-600 text-sm leading-relaxed">{review.body}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}