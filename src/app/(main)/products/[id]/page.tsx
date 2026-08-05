'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ImageZoom from '@/components/product/ImageZoom';
import ReviewSection from '@/components/product/ReviewSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import RecentlyViewed, { recordView } from '@/components/product/RecentlyViewed';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: { _id: string; name: string; slug: string } | string;
  stock: number;
  isFeatured: boolean;
  isPremiumOnly: boolean;
  averageRating?: number;
  reviewCount?: number;
}

function StarRating({ rating = 4.5, count = 24 }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <svg
            key={s}
            className={`w-4 h-4 ${s <= Math.floor(rating) ? 'text-amber-400' : s - 0.5 <= rating ? 'text-amber-300' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {rating} ({count} reviews)
      </span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const { user, isPremium } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => setProduct(d.product ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  // Record recently viewed when product loads
  useEffect(() => {
    if (!product) return;
    recordView({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? '',
      viewedAt: Date.now(),
    });
  }, [product]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    
    // Enforce quantity doesn't exceed stock
    const safeQuantity = Math.min(quantity, product.stock);

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? '',
      quantity: safeQuantity,
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
        <Link href="/products" className="mt-4 inline-block text-indigo-600 hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product._id);
  
  // Derived state for the UI
  const isLocked = product.isPremiumOnly && !isPremium;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const displayPrice = isPremium ? product.price * 0.9 : product.price;

  const categoryName = typeof product.category === 'object' && product.category !== null ? product.category.name : '';
  const categorySlug = typeof product.category === 'object' && product.category !== null ? product.category.slug : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700 transition-colors">Products</Link>
        {categoryName && (
          <>
            <span>/</span>
            <Link href={`/products?category=${categorySlug}`} className="hover:text-gray-700 transition-colors">
              {categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <ImageZoom
            images={product.images.length > 0 ? product.images : ['/placeholder.png']}
            productName={product.name}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            stock={product.stock}
            discountPct={discountPct}
            isPremiumOnly={product.isPremiumOnly}
            isLocked={isLocked}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {categoryName && (
            <Link href={`/products?category=${categorySlug}`}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-700 mb-2 self-start">
              {categoryName}
            </Link>
          )}

          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          
          <div className="mt-3">
            <StarRating rating={product.averageRating} count={product.reviewCount} />
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className={`text-3xl font-extrabold ${isPremium ? 'text-emerald-600' : 'text-gray-900'}`}>
              ${displayPrice.toFixed(2)}
            </span>
            {isPremium && (
              <span className="text-lg text-gray-400 line-through mb-0.5">
                ${product.price.toFixed(2)}
              </span>
            )}
            {!isPremium && product.originalPrice && (
              <span className="text-lg text-gray-400 line-through mb-0.5">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            {isPremium && !isLocked && (
              <span className="text-sm text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg mb-0.5">
                Premium 10% off
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className="mt-4">
            {isOutOfStock ? (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-2 rounded-xl">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Out of Stock — check back soon
              </div>
            ) : isLowStock ? (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium px-4 py-2 rounded-xl">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Only {product.stock} left in stock — order soon
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-xl">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                In Stock ({product.stock} available)
              </div>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed text-sm sm:text-base">
            {product.description}
          </p>

          <div className="border-t border-gray-100 my-6" />

          {/* Quantity + Actions block */}
          {!isLocked && (
            <div className="space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {quantity >= product.stock && (
                    <span className="text-xs text-amber-600">Max available</span>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : added
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200'
                  }`}
                >
                  {added ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart!
                    </>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart — ${(displayPrice * quantity).toFixed(2)}
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleItem(product._id)}
                  className={`px-4 py-4 rounded-2xl border-2 transition-colors ${
                    wishlisted
                      ? 'border-rose-400 text-rose-500 bg-rose-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  aria-label="Toggle wishlist"
                >
                  <svg className="w-6 h-6" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {!user && !isOutOfStock && (
                <p className="text-center text-sm text-gray-500">
                  <Link href="/login?from=/products" className="text-indigo-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                  {' '}to checkout
                </p>
              )}
            </div>
          )}

          {/* Premium upsell */}
          {!isPremium && !isLocked && (
            <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3">
              <p className="text-sm text-indigo-700">
                <span className="font-semibold">Save ${(product.price * 0.1).toFixed(2)}</span> with Premium
              </p>
              <Link href="/subscription"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline flex-shrink-0">
                Upgrade →
              </Link>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              { icon: '🚚', text: 'Free shipping' },
              { icon: '🔒', text: 'Secure checkout' },
              { icon: '↩️', text: 'Easy refunds' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReviewSection
          productId={product._id}
          averageRating={product.averageRating ?? 0}
          reviewCount={product.reviewCount ?? 0}
        />
      </div>

      {/* Related Products */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {typeof product.category === 'object' && product.category !== null && (
          <RelatedProducts
            categorySlug={(product.category as any).slug}
            currentProductId={product._id}
          />
        )}
      </div>

      {/* Recently Viewed */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecentlyViewed excludeId={product._id} />
      </div>
    </div>
  );
}