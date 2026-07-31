'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  authProvider: string;
  subscription: { status: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

const LIMIT = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [page, setPage] = useState(1);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (subscriptionFilter) params.set('subscription', subscriptionFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setPagination(
        data.pagination ?? { page: 1, totalPages: 1, totalCount: 0 }
      );
    } catch {
      showToast('Failed to load users', false);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, subscriptionFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadUsers, search]);

  const handleToggle = async (userId: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'disable' : 'enable';
    if (
      !window.confirm(
        `Are you sure you want to ${action} this user? ${
          !currentlyActive
            ? ''
            : 'They will immediately be unable to log in.'
        }`
      )
    )
      return;

    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, true);
        setUsers(prev =>
          prev.map(u =>
            u._id === userId ? { ...u, isActive: data.isActive } : u
          )
        );
      } else {
        showToast(data.error || 'Failed to update user', false);
      }
    } catch {
      showToast('Something went wrong', false);
    } finally {
      setTogglingId(null);
    }
  };

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSubscriptionFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || subscriptionFilter;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagination.totalCount} registered user
            {pagination.totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => handleFilterChange(setStatusFilter, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          {/* Subscription filter */}
          <select
            value={subscriptionFilter}
            onChange={e => handleFilterChange(setSubscriptionFilter, e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 transition-colors"
          >
            <option value="">All Plans</option>
            <option value="premium">Premium Only</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
            toast.ok
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(LIMIT)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">
            {hasFilters ? 'No users match your filters' : 'No users yet'}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['User', 'Email', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !user.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Name + avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            user.subscription?.status === 'active'
                              ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {user.authProvider === 'google' && (
                              <svg viewBox="0 0 24 24" className="w-3 h-3">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                            )}
                            <span className="text-xs text-gray-400 capitalize">
                              {user.authProvider}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      {user.subscription?.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Premium
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          Free
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggle(user._id, user.isActive)}
                          disabled={togglingId === user._id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? 'border border-red-100 text-red-600 hover:bg-red-50'
                              : 'border border-green-100 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {togglingId === user._id
                            ? '...'
                            : user.isActive
                            ? 'Disable'
                            : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map(user => (
              <div
                key={user._id}
                className={`bg-white rounded-2xl border border-gray-100 p-4 ${
                  !user.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        user.subscription?.status === 'active'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {user.subscription?.status === 'active' ? (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      ⭐ Premium
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    Joined{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/users/${user._id}`}
                    className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleToggle(user._id, user.isActive)}
                    disabled={togglingId === user._id}
                    className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
                      user.isActive
                        ? 'border border-red-100 text-red-600 hover:bg-red-50'
                        : 'border border-green-100 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {togglingId === user._id
                      ? '...'
                      : user.isActive
                      ? 'Disable'
                      : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <div className="flex gap-1">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                )
                  .filter(
                    p =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - page) <= 1
                  )
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (
                      idx > 0 &&
                      (p as number) - (arr[idx - 1] as number) > 1
                    ) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span
                        key={`d${idx}`}
                        className="px-2 py-2 text-gray-400 text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors ${
                          p === page
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}