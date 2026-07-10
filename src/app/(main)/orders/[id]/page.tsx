'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

const statusInfo = {
  Pending: {
    label: 'Payment Pending',
    desc: 'Waiting for payment confirmation.',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: '⏳',
  },
  Paid: {
    label: 'Payment Received',
    desc: 'Your payment was successful. Our team is reviewing your order.',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: '💳',
  },
  Accepted: {
    label: 'Order Accepted',
    desc: 'Great news! Your order has been confirmed and is being processed.',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: '✅',
  },
  Refunded: {
    label: 'Order Refunded',
    desc: 'Your order could not be fulfilled. A full refund has been issued.',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    icon: '↩️',
  },
  Cancelled: {
    label: 'Order Cancelled',
    desc: 'This order has been cancelled.',
    color: 'text-red-600',
    bg: 'bg-red-100',
    icon: '❌',
  },
};

const timeline: Order['status'][] = ['Pending', 'Paid', 'Accepted'];

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) setOrder(data.order);
        else setError(data.error || 'Order not found');
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <p className="mt-2 text-gray-500">{error}</p>
        <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  const info = statusInfo[order.status];
  const isRefunded = order.status === 'Refunded';
  const isCancelled = order.status === 'Cancelled';

  // Current step in the normal timeline (for non-refunded orders)
  const currentStep = timeline.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

      {/* Status banner */}
      <div className={`${info.bg} rounded-2xl p-5 sm:p-6 mb-8 text-center`}>
        <span className="text-4xl">{info.icon}</span>
        <h1 className={`text-2xl font-bold mt-3 ${info.color}`}>{info.label}</h1>
        <p className={`mt-2 text-sm ${info.color} opacity-80`}>{info.desc}</p>

        {/* Refund reason */}
        {isRefunded && order.refundReason && (
          <div className="mt-4 p-3 bg-white/70 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Refund reason
            </p>
            <p className="text-sm text-amber-800">{order.refundReason}</p>
          </div>
        )}
      </div>

      {/* Progress timeline — only for non-refunded, non-cancelled */}
      {!isRefunded && !isCancelled && (
        <div className="mb-8">
          <div className="flex items-center">
            {timeline.map((step, idx) => {
              const isCompleted = currentStep >= idx;
              const isLast = idx === timeline.length - 1;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`mt-1.5 text-xs text-center leading-tight max-w-[70px] ${
                        isCompleted ? 'text-indigo-700 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {statusInfo[step].label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 mx-1 mb-5 ${
                        currentStep > idx ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-8">
        <div className="bg-gray-50 px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <p className="text-xs text-gray-400 font-mono">#{order._id.slice(-12).toUpperCase()}</p>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 divide-y divide-gray-50">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 px-5 sm:px-6 py-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600 mb-1.5">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900">
            <span>{isRefunded ? 'Amount refunded' : 'Total paid'}</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          {isRefunded && (
            <p className="text-xs text-amber-600 mt-2">
              Refund will appear in your account within 5–10 business days.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products"
          className="flex-1 text-center py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
        >
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="flex-1 text-center py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}