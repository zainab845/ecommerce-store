'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Step = 'cart' | 'address' | 'paying';

interface AddressData {
  fullAddress: string;
  lat?: number;
  lng?: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function CartPage() {
  const {
    items,
    totalItems,
    uniqueItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const { user, isPremium } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('cart');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [editedAddress, setEditedAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  // Compute discount
  const discountAmount = isPremium ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice - discountAmount;

  // ── EARLY RETURN: Block Admins Immediately ────────────────────────
  if (user?.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Account Detected</h1>
        <p className="text-gray-500 mb-6">
          Admin accounts are restricted from placing orders to maintain accurate store analytics. 
          Please log in with a customer account to test the checkout flow.
        </p>
        <button 
          onClick={() => router.push('/admin')}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleRequestLocation = () => {
    if (!user) {
      router.push('/login?from=/cart');
      return;
    }
    setError('');
    setGeoLoading(true);

    if (!navigator.geolocation) {
      setAddress({ fullAddress: '' });
      setEditedAddress('');
      setIsEditing(true);
      setStep('address');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const readable = await reverseGeocode(latitude, longitude);
          setAddress({ fullAddress: readable, lat: latitude, lng: longitude });
          setEditedAddress(readable);
          setStep('address');
        } catch {
          setAddress({ fullAddress: '' });
          setEditedAddress('');
          setIsEditing(true);
          setStep('address');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setAddress({ fullAddress: '' });
        setEditedAddress('');
        setIsEditing(true);
        setStep('address');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleConfirmAndPay = async () => {
    const finalAddress = isEditing
      ? editedAddress.trim()
      : address?.fullAddress ?? '';

    if (!finalAddress) {
      setError('Please enter your delivery address before continuing.');
      return;
    }

    setError('');
    setPaying(true);
    setStep('paying');

    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          totalAmount: finalTotal,
          shippingAddress: finalAddress,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/login?from=/cart');
        return;
      }

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout. Please try again.');
        setStep('address');
        setPaying(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('address');
      setPaying(false);
    }
  };

  // ── Empty cart ────────────────────────────────────────────────────
  if (totalItems === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-500">Add some products to get started.</p>
        <Link
          href="/products"
          className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // ── Address confirmation screen ───────────────────────────────────
  if (step === 'address' || step === 'paying') {
    const displayAddress = isEditing ? editedAddress : (address?.fullAddress ?? '');

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {step !== 'paying' && (
          <button
            onClick={() => {
              setStep('cart');
              setIsEditing(false);
              setError('');
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to cart
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Confirm Delivery Address
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {isEditing
            ? 'Enter your delivery address manually'
            : 'We detected your location. Confirm or edit before continuing.'}
        </p>

        {/* Address card */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <svg
                className="w-4 h-4 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Delivery address
            </div>
            {!isEditing && step !== 'paying' && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedAddress(address?.fullAddress ?? '');
                }}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="px-5 py-5">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editedAddress}
                  onChange={e => setEditedAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!editedAddress.trim()) return;
                      setAddress(prev => ({
                        ...prev,
                        fullAddress: editedAddress.trim(),
                      }));
                      setIsEditing(false);
                    }}
                    disabled={!editedAddress.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Save address
                  </button>
                  {address?.fullAddress && (
                    <button
                      onClick={() => {
                        setEditedAddress(address.fullAddress);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm leading-relaxed">
                {displayAddress || (
                  <span className="text-gray-400 italic">No address provided</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Order summary on address screen */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Order summary</p>
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-gray-600"
              >
                <span className="truncate max-w-[200px]">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900 ml-4">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1.5">
            {isPremium && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Premium 10% discount
                </span>
                <span>−${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirmAndPay}
          disabled={paying || isEditing || !displayAddress.trim()}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {paying ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Redirecting to payment...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Confirm & Pay — ${finalTotal.toFixed(2)}
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-2">
          Secured by Stripe. Your card details are never stored.
        </p>
      </div>
    );
  }

  // ── Main cart view ────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Shopping Cart{' '}
          <span className="text-gray-400 font-normal text-base sm:text-lg">
            ({uniqueItems} {uniqueItems === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Clear cart
        </button>
      </div>

      {/* Premium discount banner */}
      {isPremium && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Premium member discount applied
            </p>
            <p className="text-xs text-emerald-600">
              You save ${discountAmount.toFixed(2)} (10% off) on this order
            </p>
          </div>
        </div>
      )}

      {/* Cart items */}
      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div
            key={item.id}
            className="flex gap-3 sm:gap-4 p-4 bg-white border border-gray-100 rounded-2xl"
          >
            <img
              src={item.image || '/placeholder.png'}
              alt={item.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 bg-gray-50"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {isPremium ? (
                  <>
                    <span className="text-emerald-600 font-bold text-sm">
                      ${(item.price * 0.9).toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-xs line-through">
                      ${item.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">
                    ${item.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 sm:gap-3">
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    if (item.quantity === 1) removeItem(item.id);
                    else updateQuantity(item.id, item.quantity - 1);
                  }}
                  className="px-2 sm:px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm"
                >
                  −
                </button>
                <span className="px-2 sm:px-3 py-1.5 text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2 sm:px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                ${(item.price * (isPremium ? 0.9 : 1) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-2xl p-5 sm:p-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        {isPremium && (
          <div className="flex justify-between text-sm text-emerald-600 font-medium mb-2">
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Premium 10% discount
            </span>
            <span>−${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900 text-lg">
          <span>Total</span>
          <span>${finalTotal.toFixed(2)}</span>
        </div>

        {!user && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-700 text-center">
              Please{' '}
              <Link href="/login?from=/cart" className="font-semibold underline">
                log in
              </Link>{' '}
              to place your order
            </p>
          </div>
        )}

        {user && !isPremium && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
            <p className="text-sm text-indigo-700">
              Get 10% off every order with Premium
            </p>
            <Link
              href="/subscription"
              className="flex-shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              Upgrade →
            </Link>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleRequestLocation}
          disabled={geoLoading}
          className="w-full mt-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {geoLoading ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Detecting location...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {user ? `Pay Now — $${finalTotal.toFixed(2)}` : 'Log in to Checkout'}
            </>
          )}
        </button>

        {user && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Secured by Stripe. Your card details are never stored.
          </p>
        )}

        <Link
          href="/products"
          className="block text-center mt-3 text-sm text-indigo-600 hover:underline"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}