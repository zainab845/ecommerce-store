'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Accepted' | 'Refunded' | 'Cancelled';
  refundReason?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  Pending: {
    label: 'Payment Pending',
    cls: 'bg-gray-100 text-gray-600',
    icon: '⏳',
  },
  Paid: {
    label: 'Payment Confirmed',
    cls: 'bg-blue-100 text-blue-700',
    icon: '💳',
  },
  Accepted: {
    label: 'Order Accepted',
    cls: 'bg-emerald-100 text-emerald-700',
    icon: '✅',
  },
  Refunded: {
    label: 'Refunded',
    cls: 'bg-amber-100 text-amber-700',
    icon: '↩️',
  },
  Cancelled: {
    label: 'Cancelled',
    cls: 'bg-red-100 text-red-600',
    icon: '❌',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.orders) setOrders(d.orders);
        else setError(d.error || 'Failed to load orders');
      })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {!loading && !error && `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            Back to Home
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">No orders yet</h2>
          <p className="text-gray-500 mt-2">When you place an order it will appear here.</p>
          <Link href="/products"
            className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const s = statusConfig[order.status] ?? statusConfig.Pending;
            return (
              <div key={order._id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors">
                {/* Order header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-mono text-gray-400">
                      #{order._id.slice(-12).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
                      {s.icon} {s.label}
                    </span>
                    <Link href={`/orders/${order._id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                      View →
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="px-5 sm:px-6 py-4">
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span className="truncate max-w-[240px]">
                          {item.name}
                          <span className="text-gray-400 ml-1">× {item.quantity}</span>
                        </span>
                        <span className="font-medium text-gray-900 ml-4">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Refund reason */}
                  {order.status === 'Refunded' && order.refundReason && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">Refund reason:</span> {order.refundReason}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-bold text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}