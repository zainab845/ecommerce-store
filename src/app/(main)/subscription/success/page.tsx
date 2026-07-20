'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function SuccessContent() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading');

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 10;

    async function poll() {
      if (cancelled) return;

      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.subscription?.status === 'active') {
            // Refresh AuthContext so isPremium becomes true before navigating away
            await refreshUser();
            if (!cancelled) setStatus('success');
            return;
          }
        }
      } catch {
        // Network error — keep retrying
      }

      retries++;
      if (retries >= MAX_RETRIES) {
        if (!cancelled) setStatus('timeout');
        return;
      }

      // Schedule next poll
      if (!cancelled) setTimeout(poll, 2000);
    }

    poll(); // immediate first check

    return () => {
      cancelled = true;
    };
  }, [refreshUser]); // refreshUser is now stable via useCallback

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activating your subscription…</h1>
        <p className="text-gray-500">Confirming payment with Stripe. This takes a few seconds.</p>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Still processing…</h1>
        <p className="text-gray-500 mb-2">
          Your payment went through but Stripe is still sending the confirmation.
          Your account will upgrade automatically within a minute.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Refresh the page in 30 seconds if you don&apos;t see your benefits.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Refresh page
          </button>
          <Link href="/"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // status === 'success'
  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Premium!</h1>
      <p className="mt-3 text-gray-500 text-lg">
        Your subscription is active. Enjoy 10% off every order and exclusive Premium products.
      </p>

      <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-left space-y-3">
        <h2 className="font-semibold text-indigo-900 text-sm">Your Premium benefits:</h2>
        {[
          '10% discount applied automatically at checkout',
          'Exclusive Premium-only products unlocked',
          'Priority support',
        ].map(b => (
          <div key={b} className="flex items-center gap-2 text-sm text-indigo-800">
            <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {b}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/products"
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Start Shopping with Discount
        </Link>
        <Link href="/subscription"
          className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}