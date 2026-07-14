'use client';

import { useState, useEffect, useCallback } from 'react';

interface Order {
  _id: string;
  user: { name: string; email: string } | null;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Accepted' | 'Refunded' | 'Cancelled';
  refundReason?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-gray-100 text-gray-600',
  Paid: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Refunded: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-600',
};

const LIMIT = 10;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [refundModal, setRefundModal] = useState({ open: false, orderId: '', reason: '' });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setPagination(data.pagination ?? { page: 1, totalPages: 1, totalCount: 0 });
    } catch {
      showMessage('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleAccept = async (orderId: string) => {
    if (!window.confirm('Accept this order?')) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) { showMessage('Order accepted', 'success'); loadOrders(); }
      else showMessage(data.error || 'Failed', 'error');
    } catch { showMessage('Something went wrong', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleRefund = async () => {
    if (!refundModal.reason.trim()) return;
    setActionLoading(refundModal.orderId);
    try {
      const res = await fetch(`/api/admin/orders/${refundModal.orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundModal.reason }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('Refund issued', 'success');
        setRefundModal({ open: false, orderId: '', reason: '' });
        loadOrders();
      } else showMessage(data.error || 'Failed', 'error');
    } catch { showMessage('Something went wrong', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pagination.totalCount} total</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {['', 'Pending', 'Paid', 'Accepted', 'Refunded', 'Cancelled'].map(s => (
              <button key={s || 'all'}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(LIMIT)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No orders found</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-400 font-mono">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{order.items.length} item(s)</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                      {order.status === 'Refunded' && order.refundReason && (
                        <p className="text-xs text-amber-600 mt-1 max-w-[120px] truncate">
                          {order.refundReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {order.status === 'Paid' && (
                          <button onClick={() => handleAccept(order._id)}
                            disabled={actionLoading === order._id}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                            {actionLoading === order._id ? '...' : 'Accept'}
                          </button>
                        )}
                        {(order.status === 'Paid' || order.status === 'Accepted') && (
                          <button onClick={() => setRefundModal({ open: true, orderId: order._id, reason: '' })}
                            disabled={actionLoading === order._id}
                            className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                            Refund
                          </button>
                        )}
                        {!['Paid', 'Accepted'].includes(order.status) && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="font-medium text-gray-900">{order.user?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{order.items.length} item(s)</span>
                  <span className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  {order.status === 'Paid' && (
                    <button onClick={() => handleAccept(order._id)}
                      className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                      Accept
                    </button>
                  )}
                  {(order.status === 'Paid' || order.status === 'Accepted') && (
                    <button onClick={() => setRefundModal({ open: true, orderId: order._id, reason: '' })}
                      className="flex-1 py-2 text-sm font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Issue Refund</h2>
            <p className="text-sm text-gray-500 mb-5">Provide a reason for the refund.</p>
            <textarea rows={4}
              placeholder="e.g. Item out of stock, unable to fulfill..."
              value={refundModal.reason}
              onChange={e => setRefundModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-300 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRefundModal({ open: false, orderId: '', reason: '' })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRefund}
                disabled={!refundModal.reason.trim() || actionLoading !== null}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {actionLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}