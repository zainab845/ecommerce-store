'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const features = {
  free: [
    'Browse all regular products',
    'Add to cart and wishlist',
    'Standard pricing',
    'Email support',
  ],
  premium: [
    'Everything in Free',
    '10% discount on every order',
    'Access to Premium-only products',
    'Early access to new arrivals',
    'Priority support',
    'Cancel anytime',
  ],
};

export default function SubscriptionPage() {
  const { user, isPremium } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login?from=/subscription');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/checkout', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start subscription');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Upgrade to Premium</h1>
        <p className="mt-4 text-lg text-gray-500">Get 10% off every order and exclusive benefits</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free */}
        <div className="border border-gray-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold">Free</h2>
          <div className="mt-4 mb-8">
            <span className="text-5xl font-bold">$0</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3">
            {features.free.map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="border-2 border-indigo-600 rounded-2xl p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-4 py-1 rounded-full">
            RECOMMENDED
          </div>
          <h2 className="text-2xl font-bold text-indigo-700">Premium</h2>
          <div className="mt-4 mb-8">
            <span className="text-5xl font-bold">$9.99</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3">
            {features.premium.map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full mt-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? 'Redirecting...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}