import Link from 'next/link';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';

async function getStats() {
  await connectToDatabase();
  const [products, categories, featured, lowStock] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments({ isFeatured: true }),
    Product.countDocuments({ stock: { $lt: 5 } }),
  ]);
  return { products, categories, featured, lowStock };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: 'Total Products', value: stats.products, href: '/admin/products', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    { label: 'Categories', value: stats.categories, href: '/admin/categories', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    { label: 'Featured', value: stats.featured, href: '/admin/products', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    { label: 'Low Stock', value: stats.lowStock, href: '/admin/products', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Overview of your store</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {cards.map(card => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-2xl border ${card.border} ${card.bg} p-6 hover:shadow-sm transition-shadow`}
          >
            <p className={`text-sm font-medium ${card.text} opacity-80`}>{card.label}</p>
            <p className={`text-4xl font-bold ${card.text} mt-2`}>{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-sm">
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-2">
          {[
            { label: '+ Add New Product', href: '/admin/products/new' },
            { label: '+ Add New Category', href: '/admin/categories' },
            { label: '↗ View Store', href: '/' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium text-gray-700"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}