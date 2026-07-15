'use client';

import { useState, useEffect } from 'react';

interface Subscriber {
  _id: string;
  name: string;
  email: string;
  subscription: {
    status: string;
    currentPeriodEnd?: string;
  };
  createdAt: string;
}

interface Stats {
  total: number;
  monthlyRevenue: number;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then(r => r.json())
      .then(d => {
        setSubscribers(d.subscribers ?? []);
        setStats(d.stats ?? { total: 0, monthlyRevenue: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Premium Subscribers</h1>
        <p className="text-gray-500 mt-1 text-sm">Active Premium memberships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-sm font-medium text-indigo-600">Active Subscribers</p>
          <p className="text-4xl font-bold text-indigo-700 mt-2">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
          <p className="text-sm font-medium text-emerald-600">Monthly Revenue</p>
          <p className="text-4xl font-bold text-emerald-700 mt-2">
            ${stats.monthlyRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-400 font-medium">No premium subscribers yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                {['Name', 'Email', 'Status', 'Renews'].map(h => (
                  <th key={h}
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscribers.map(sub => (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 text-sm">{sub.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-500">{sub.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-500">
                      {sub.subscription.currentPeriodEnd
                        ? new Date(sub.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}