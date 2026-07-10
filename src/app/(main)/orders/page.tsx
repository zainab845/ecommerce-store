'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  name: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Accepted' | 'Refunded' | 'Cancelled';
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-600',
  Paid: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Refunded: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
        else setError(data.error || 'Failed to load orders');
      })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link href="/products" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-sm font-semibold text-gray-900">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {order.items.length} item(s) • <span className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </p>
              </div>

              <Link 
                href={`/orders/${order._id}`}
                className="px-5 py-2.5 bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors text-center border border-gray-200"
              >
                View Status
              </Link>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}