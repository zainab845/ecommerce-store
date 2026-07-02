'use client';

import { useState, useEffect } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import Link from 'next/link';

export default function WishlistPage() {
  const { items: wishlistIds, toggleItem } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      return;
    }
    setLoading(true);
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        const all: Product[] = d.products ?? [];
        setProducts(all.filter(p => wishlistIds.includes(p._id)));
      })
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  if (wishlistIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🤍</div>
        <h1 className="text-2xl font-bold text-gray-900">Your wishlist is empty</h1>
        <p className="mt-2 text-gray-500">Save items you love for later.</p>
        <Link href="/products"
          className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Wishlist <span className="text-gray-400 font-normal text-lg">({wishlistIds.length})</span>
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
              <Link href={`/products/${product._id}`}
                className="block aspect-square bg-gray-50 overflow-hidden">
                <img src={product.images[0] ?? '/placeholder.png'} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </Link>
              <div className="p-4">
                <Link href={`/products/${product._id}`}>
                  <h3 className="font-medium text-gray-900 truncate hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="font-bold text-gray-900 mt-1">${product.price.toFixed(2)}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => addItem({ id: product._id, name: product.name, price: product.price, image: product.images[0] ?? '', quantity: 1 })}
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Add to Cart
                  </button>
                  <button
                    onClick={() => toggleItem(product._id)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    aria-label="Remove from wishlist">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}