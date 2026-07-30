'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function PremiumCTA() {
  const { user, isPremium } = useAuth();

  // Don't show to premium members
  if (isPremium) return null;

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
          Unlock Premium Benefits
        </h2>
        <p className="mt-5 text-lg text-indigo-200 max-w-2xl mx-auto leading-relaxed">
          Join thousands of smart shoppers who save money every month with E-Shop Premium.
          Just <span className="text-white font-bold">$9.99/month</span> — cancel anytime.
        </p>

        {/* Benefits */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: '💸', title: '10% Off Everything', desc: 'Automatic discount on every order' },
            { icon: '🔓', title: 'Exclusive Products', desc: 'Access Premium-only items' },
            { icon: '🚀', title: 'Priority Support', desc: 'Skip the queue every time' },
          ].map(b => (
            <div key={b.title} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{b.icon}</div>
              <p className="text-white font-semibold text-sm">{b.title}</p>
              <p className="text-indigo-300 text-xs mt-1">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/subscription"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-400 text-amber-900 font-bold rounded-2xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-900/30 text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Get Premium — $9.99/mo
          </Link>

          {!user && (
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-sm"
            >
              Create Free Account
            </Link>
          )}
        </div>

        <p className="mt-5 text-indigo-400 text-xs">
          No commitment · Cancel anytime · Instant access
        </p>
      </div>
    </section>
  );
}