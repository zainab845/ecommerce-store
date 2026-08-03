'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm mb-5">
          This link is missing a token. Please request a new password reset.
        </p>
        <Link href="/forgot-password"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors">
          Request New Link
        </Link>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors';

  return success ? (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Password Reset!</h2>
      <p className="text-gray-500 text-sm">
        Your password has been updated successfully. Redirecting you to login...
      </p>
      <Link href="/login" className="mt-5 inline-block text-sm text-indigo-600 hover:underline font-medium">
        Go to Login now →
      </Link>
    </div>
  ) : (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
        <input
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          className={inputClass}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
        <input
          type="password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError(''); }}
          className={inputClass}
        />
      </div>

      {/* Password strength indicator */}
      {password && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[
              password.length >= 8,
              /[A-Z]/.test(password),
              /[0-9]/.test(password),
              /[^A-Za-z0-9]/.test(password),
            ].map((met, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${met ? 'bg-green-400' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Strong passwords include uppercase, numbers, and symbols
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-gray-900">
              E-Shop<span className="text-indigo-600">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Set a new password</h1>
          <p className="text-gray-500 mt-2 text-sm">Choose a strong password you haven't used before</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <Suspense fallback={
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}