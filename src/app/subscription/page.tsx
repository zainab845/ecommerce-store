'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  const { user, isPremium, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Opens Stripe Customer Portal
      } else {
        alert(data.error || 'Failed to load portal');
      }
    } catch (error) {
      alert('Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading) return null;

  // ── PREMIUM USER VIEW (History & Management) ──
  if (isPremium) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Manage Your Premium Subscription</h1>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 mb-8 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold text-indigo-900 mb-2">Status: Active</h2>
          <p className="text-indigo-700 text-sm mb-8 leading-relaxed">
            Access your complete billing history, download past invoices, view renewal dates, update payment methods, or cancel your subscription below.
          </p>
          <button 
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {portalLoading ? 'Opening Secure Portal...' : 'View History & Manage Billing'}
          </button>
        </div>
      </div>
    );
  }

  // ── FREE USER VIEW (Upgrade) ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Upgrade to Premium</h1>
        <p className="mt-4 text-lg text-gray-500">Get 10% off every order and exclusive benefits</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
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