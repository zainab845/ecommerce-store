'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, totalItems, uniqueItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  // Save summary before cart clears so success screen shows correct values
  const [orderSummary, setOrderSummary] = useState<{
    itemCount: number;
    uniqueCount: number;
    total: number;
    orderId: string;
  } | null>(null);

  const handlePlaceOrder = async () => {
    // If not logged in, redirect to login with return URL
    if (!user) {
      router.push('/login?from=/cart');
      return;
    }

    setPlacingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          totalAmount: totalPrice,
          shippingAddress: {
            fullName: user.name,
            address: 'To be provided',
            city: 'To be provided',
            phone: 'To be provided',
          },
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Token expired mid-session
        router.push('/login?from=/cart');
        return;
      }

      if (res.ok && data.orderId) {
        // Save summary BEFORE clearing cart
        setOrderSummary({
          itemCount: totalItems,
          uniqueCount: uniqueItems,
          total: totalPrice,
          orderId: data.orderId,
        });
        localStorage.setItem('lastOrderId', data.orderId);
        clearCart();
        setOrderPlaced(true);
      } else {
        alert(data.error || 'Failed to place order. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Order success screen ──────────────────────────────────────────
  if (orderPlaced && orderSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="mt-3 text-gray-500 text-lg">
          Thank you for your purchase. Your order has been confirmed and is being processed.
        </p>

        <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left max-w-sm mx-auto space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-3">Order summary</p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Products</span>
            <span>{orderSummary.uniqueCount} {orderSummary.uniqueCount === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total quantity</span>
            <span>{orderSummary.itemCount}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
            <span>Total paid</span>
            <span>${orderSummary.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="text-gray-500">Status</span>
            <span className="text-amber-600 font-medium">Pending</span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-gray-400">Order ID</span>
            <span className="text-gray-400 font-mono truncate max-w-[160px]">{orderSummary.orderId}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────
  if (totalItems === 0 && !orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Add some products to get started.</p>
        <Link href="/products"
          className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  // ── Cart page ─────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Shopping Cart{' '}
          <span className="text-gray-400 font-normal text-base sm:text-lg">({uniqueItems})</span>
        </h1>
        <button onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 transition-colors">
          Clear cart
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.id}
            className="flex gap-3 sm:gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
            <img src={item.image || '/placeholder.png'} alt={item.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 bg-gray-50" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{item.name}</h3>
              <p className="text-indigo-600 font-bold mt-1 text-sm">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 sm:gap-3">
              <button onClick={() => removeItem(item.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Remove
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => {
                  if (item.quantity === 1) removeItem(item.id);
                  else updateQuantity(item.id, item.quantity - 1);
                }} className="px-2 sm:px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm">−</button>
                <span className="px-2 sm:px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2 sm:px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm">+</button>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-5 sm:p-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 text-lg">
          <span>Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        {/* Show login prompt if not logged in */}
        {!user && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-700 text-center">
              Please{' '}
              <Link href="/login?from=/cart" className="font-semibold underline">
                log in
              </Link>
              {' '}to place your order
            </p>
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="w-full mt-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          {placingOrder ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : user ? 'Place Order' : 'Log in to Place Order'}
        </button>
        <Link href="/products"
          className="block text-center mt-3 text-sm text-indigo-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}