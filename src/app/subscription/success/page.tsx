'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('failed');
        return;
      }

      try {
        // Hit our new robust verification endpoint
        // New uncached POST request
        const res = await fetch('/api/subscription/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          await refreshUser(); // Force AuthContext to grab the updated MongoDB data
          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
      }
    };

    verifySubscription();
  }, [searchParams, refreshUser]);

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h1>
        <p className="text-gray-500">Please wait while we confirm your subscription securely with Stripe.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
        <p className="text-gray-500 mb-8">We couldn't verify your subscription. If you were charged, please contact support.</p>
        <button onClick={() => router.push('/subscription')} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Premium!</h1>
      <p className="mt-3 text-gray-500 text-lg">Your subscription is now active. Enjoy 10% off every order and exclusive Premium products.</p>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/products" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Start Shopping with Discount
        </Link>
        <Link href="/subscription" className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}