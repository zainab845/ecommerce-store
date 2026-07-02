'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  if (totalItems === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🛒</div>
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
          Shopping Cart <span className="text-gray-400 font-normal text-lg">({totalItems})</span>
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
        <button className="w-full mt-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Proceed to Checkout
        </button>
        <Link href="/products"
          className="block text-center mt-3 text-sm text-indigo-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}