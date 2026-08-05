'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'eshop_recently_viewed';
const MAX_ITEMS = 10;

export interface ViewedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  viewedAt: number;
}

// Call this from the product detail page to record a view
export function recordView(product: ViewedProduct) {
  try {
    const existing: ViewedProduct[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    );
    const updated = [
      product,
      ...existing.filter(p => p.id !== product.id),
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentlyViewed(): ViewedProduct[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

interface Props {
  excludeId?: string; // current product to exclude
  maxDisplay?: number;
}

export default function RecentlyViewed({ excludeId, maxDisplay = 4 }: Props) {
  const [viewed, setViewed] = useState<ViewedProduct[]>([]);
  const { isPremium } = useAuth();

  useEffect(() => {
    const items = getRecentlyViewed()
      .filter(p => p.id !== excludeId)
      .slice(0, maxDisplay);
    setViewed(items);
  }, [excludeId, maxDisplay]);

  if (viewed.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <h2 className="text-xl font-extrabold text-gray-900 mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {viewed.map(product => {
          const displayPrice = isPremium ? product.price * 0.9 : product.price;
          return (
            <Link key={product.id} href={`/products/${product.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <img src={product.image || '/placeholder.png'} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <h3 className="text-xs font-semibold text-gray-900 truncate">{product.name}</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-sm font-bold ${isPremium ? 'text-emerald-600' : 'text-gray-900'}`}>
                    ${displayPrice.toFixed(2)}
                  </span>
                  {isPremium && (
                    <span className="text-xs text-gray-400 line-through">${product.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}