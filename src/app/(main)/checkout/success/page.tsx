'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { clearCart } = useCart();

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. If you completed payment, your order was received.');
      setLoading(false);
      return;
    }

    // Clear the cart now that payment is confirmed
    clearCart();

    // Poll briefly to allow webhook to process (Stripe webhooks arrive within seconds)
    const fetchOrder = async (retries = 3) => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok && data.order) {
          setOrder(data.order);
          setLoading(false);
        } else if (retries > 0) {
          // Webhook may not have fired yet — retry after 1.5s
          setTimeout(() => fetchOrder(retries - 1), 1500);
        } else {
          setError(data.error || 'Could not load order details.');
          setLoading(false);
        }
      } catch {
        if (retries > 0) {
          setTimeout(() => fetchOrder(retries - 1), 1500);
        } else {
          setError('Failed to load order details.');
          setLoading(false);
        }
      }
    };

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 font-medium">Confirming your payment...</p>
        <p className="mt-1 text-gray-400 text-sm">This only takes a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Received</h1>
        <p className="mt-2 text-gray-500">{error}</p>
        <p className="mt-2 text-gray-400 text-sm">
          Your payment was processed. Check your email for confirmation.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mt-3 text-gray-500 text-lg">
          Your order has been received and is now being reviewed.
        </p>
      </div>

      {order && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-8">
          {/* Order header */}
          <div className="bg-gray-50 px-5 sm:px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-700">Order ID</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{order._id}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full self-start sm:self-auto">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Payment confirmed
              </span>
            </div>
          </div>

          {/* Items */}
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

          {/* Totals */}
          <div className="bg-gray-50 px-5 sm:px-6 py-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total paid</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 sm:p-6 mb-8">
        <h2 className="font-semibold text-indigo-900 mb-3">What happens next?</h2>
        <div className="space-y-3">
          {[
            { step: '1', label: 'Order review', desc: 'Our team reviews your order and confirms availability' },
            { step: '2', label: 'Acceptance', desc: 'You will be notified once your order is accepted' },
            { step: '3', label: 'Delivery', desc: 'Your order will be shipped and on its way to you' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-indigo-900">{item.label}</p>
                <p className="text-xs text-indigo-700 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products"
          className="flex-1 text-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </Link>
        {order && (
          <Link
            href={`/orders/${order._id}`}
            className="flex-1 text-center px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            View Order Status
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}