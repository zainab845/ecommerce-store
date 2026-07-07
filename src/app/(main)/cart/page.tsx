'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
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
          quantity: item.quantity
        })),
        totalAmount: totalPrice,
        shippingAddress: {
          fullName: "Test User", // Replace with real form later
          address: "123 Test Street",
          city: "Test City",
          phone: "1234567890"
        }
      })
    });

    const data = await res.json();

    if (data.orderId) {
      localStorage.setItem('lastOrderId', data.orderId);
      clearCart();
      setOrderPlaced(true);

      // Optional: redirect to checkout after a delay
      setTimeout(() => {
        window.location.href = `/checkout/${data.orderId}`;
      }, 1500);
    } else {
      alert(data.error || 'Failed to place order');
    }
  } catch (err) {
    alert('Something went wrong. Please try again.');
  } finally {
    setPlacingOrder(false);
  }
};

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="mt-3 text-gray-500 text-lg">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-left max-w-sm mx-auto">
          <p className="text-sm font-semibold text-gray-700 mb-3">Order summary</p>
          <div className="flex justify-between text-sm text-gray-600 mb-1.5">
            <span>Items</span>
            <span>{totalItems > 0 ? totalItems : 'Confirmed'}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1.5">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
            <span>Status</span>
            <span className="text-green-600">Processing</span>
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

  // Empty cart
  if (totalItems === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Shopping Cart{' '}
          <span className="text-gray-400 font-normal text-lg">({totalItems})</span>
        </h1>
        <button onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 transition-colors">
          Clear cart
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.id}
            className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
            <img src={item.image || '/placeholder.png'} alt={item.name}
              className="w-20 h-20 object-cover rounded-xl flex-shrink-0 bg-gray-50" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
              <p className="text-indigo-600 font-bold mt-1">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button onClick={() => removeItem(item.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Remove
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => {
                  if (item.quantity === 1) removeItem(item.id);
                  else updateQuantity(item.id, item.quantity - 1);
                }} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm">−</button>
                <span className="px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm">+</button>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal ({totalItems} items)</span>
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
        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="w-full mt-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          {placingOrder ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Processing...
            </span>
          ) : 'Place Order'}
        </button>
        <Link href="/products"
          className="block text-center mt-3 text-sm text-indigo-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}