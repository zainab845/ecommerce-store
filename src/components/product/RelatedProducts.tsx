'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: { name: string } | string;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

interface Props {
  categorySlug: string;
  currentProductId: string;
}

function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function RelatedProducts({ categorySlug, currentProductId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = useAuth();

  useEffect(() => {
    if (!categorySlug) { setLoading(false); return; }
    fetch(`/api/products?category=${categorySlug}&limit=5`)
      .then(r => r.json())
      .then(d => {
        const filtered = (d.products ?? []).filter(
          (p: Product) => p._id !== currentProductId
        ).slice(0, 4);
        setProducts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug, currentProductId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-gray-900">Related Products</h2>
        <Link href={`/products?category=${categorySlug}`}
          className="text-sm text-indigo-600 hover:underline font-medium">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map(product => {
            const displayPrice = isPremium ? product.price * 0.9 : product.price;
            return (
              <Link key={product._id} href={`/products/${product._id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img src={product.images?.[0] ?? '/placeholder.png'} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-900 truncate">{product.name}</h3>
                  {(product.reviewCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <MiniStars rating={product.averageRating ?? 0} />
                      <span className="text-[10px] text-gray-400">({product.reviewCount})</span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isPremium ? 'text-emerald-600' : 'text-gray-900'}`}>
                      ${displayPrice.toFixed(2)}
                    </span>
                    {isPremium && (
                      <span className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  {product.stock === 0 && (
                    <span className="text-[10px] text-red-500 font-medium">Out of stock</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}