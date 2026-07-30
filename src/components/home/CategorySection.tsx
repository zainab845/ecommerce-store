'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

// Fallback colors per category index
const gradients = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
  'from-green-500 to-teal-600',
  'from-yellow-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-2">
            Browse by category
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Shop by Category
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Explore our wide selection of products organized by category.
            Find exactly what you need, fast.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl h-40 flex items-end p-4 transition-all hover:-translate-y-1 hover:shadow-xl duration-300"
              >
                {/* Background image or gradient */}
                {cat.image ? (
                  <>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx % gradients.length]}`} />
                )}

                {/* Text */}
                <div className="relative">
                  <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            ))}

            {/* View all link as last card */}
            <Link
              href="/categories"
              className="group relative overflow-hidden rounded-2xl h-40 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-500 group-hover:text-indigo-600 transition-colors">
                  All Categories
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}