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
  const { user, isPremium, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login?from=/subscription');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/checkout', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start subscription');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your Premium subscription? You will keep access until the end of your billing period.')) return;
    setCancelLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCancelSuccess(true);
        await refreshUser();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Upgrade to Premium
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Get 10% off every order and access exclusive premium products.
          Cancel anytime — no commitment.
        </p>

        {isPremium && (
          <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You are a Premium member
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Free Plan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
          <p className="text-gray-500 text-sm mb-4">Everything you need to get started</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">$0</span>
            <span className="text-gray-500 ml-1">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {features.free.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <div className="w-full py-3 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl text-center">
            Current plan
          </div>
        </div>

        {/* Premium Plan */}
        <div className={`relative rounded-2xl p-8 ${
          isPremium
            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-2 border-indigo-500'
            : 'bg-gradient-to-br from-indigo-600 to-indigo-700'
        }`}>
          {/* Popular badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
              Most Popular
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Premium</h2>
          <p className="text-indigo-200 text-sm mb-4">
            The best experience for serious shoppers
          </p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$9.99</span>
            <span className="text-indigo-200 ml-1">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {features.premium.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                <svg className="w-4 h-4 text-indigo-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <div>
              <div className="w-full py-3 bg-white/20 text-white text-sm font-semibold rounded-xl text-center mb-3">
                ✓ Active subscription
              </div>
              {user?.subscription?.currentPeriodEnd && (
                <p className="text-indigo-200 text-xs text-center">
                  Renews {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          ) : (
            <button onClick={handleSubscribe} disabled={loading}
              className="w-full py-3 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting to payment...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Subscribe — $9.99/mo
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-center">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Cancel section for premium users */}
      {isPremium && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Manage Subscription</h3>

          {cancelSuccess ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl">
              Your subscription will be cancelled at the end of your billing period.
              You will keep Premium access until then.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Need to cancel? You will keep Premium access until the end of your current billing period.
              </p>
              <button onClick={handleCancel} disabled={cancelLoading}
                className="text-sm text-red-600 hover:text-red-700 font-medium underline disabled:opacity-50 transition-colors">
                {cancelLoading ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Secured by Stripe. Cancel anytime with no fees. 
        <Link href="/products" className="text-indigo-600 hover:underline ml-1">Back to shopping</Link>
      </p>
    </div>
  );
}