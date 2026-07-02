import Link from 'next/link';
import { Category } from '@/types';

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Categories</h1>

      {categories.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-video flex items-end p-6 hover:shadow-md transition-shadow"
            >
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 w-full">
                <h2 className="font-bold text-gray-900">{cat.name}</h2>
                {cat.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}