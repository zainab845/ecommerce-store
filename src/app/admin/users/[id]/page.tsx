'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  authProvider: string;
  subscription: {
    status: string;
    currentPeriodEnd?: string;
    stripeSubscriptionId?: string;
  };
  createdAt: string;
}

interface Order {
  _id: string;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  refundedOrders: number;
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-600',
  Paid: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Refunded: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          setOrders(d.orders ?? []);
          setStats(d.stats);
        }
      })
      .catch(() => showToast('Failed to load user', false))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async () => {
    if (!user) return;
    const action = user.isActive ? 'disable' : 'enable';
    if (
      !window.confirm(`Are you sure you want to ${action} this user?`)
    )
      return;

    setToggling(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { ...prev, isActive: data.isActive } : null);
        showToast(data.message, true);
      } else {
        showToast(data.error || 'Failed', false);
      }
    } catch {
      showToast('Something went wrong', false);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 font-medium">User not found</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
              user.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            {user.isActive ? 'Active' : 'Disabled'}
          </span>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
              user.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {toggling ? '...' : user.isActive ? 'Disable Account' : 'Enable Account'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.ok
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.totalOrders, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending', value: stats.pendingOrders, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Refunds', value: stats.refundedOrders, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* User info + subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Info</h2>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Sign-in Method', value: user.authProvider },
              {
                label: 'Member Since',
                value: new Date(user.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-medium text-gray-900 capitalize">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plan</span>
              <span>
                {user.subscription?.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    ⭐ Premium
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium capitalize">
                    {user.subscription?.status || 'free'}
                  </span>
                )}
              </span>
            </div>
            {user.subscription?.currentPeriodEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Renews</span>
                <span className="font-medium text-gray-900">
                  {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {user.subscription?.stripeSubscriptionId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stripe ID</span>
                <span className="font-mono text-xs text-gray-400 truncate max-w-[160px]">
                  {user.subscription.stripeSubscriptionId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Order History</h2>
          <span className="text-xs text-gray-400">{orders.length} orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No orders placed yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map(order => (
              <div key={order._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-gray-400">
                    #{order._id.slice(-10).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} —{' '}
                    {order.items.slice(0, 2).map(i => i.name).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusStyles[order.status] ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}