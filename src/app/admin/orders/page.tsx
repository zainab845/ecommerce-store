'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user: { name: string; email: string } | null;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Accepted' | 'Refunded' | 'Cancelled';
  refundReason?: string;
  stripePaymentIntentId?: string;
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

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // URL Parameters State
  const page = parseInt(searchParams.get('page') || '1');
  const statusFilter = searchParams.get('status') || 'All';
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, totalCount: 0 });

  // Refund modal state
  const [refundModal, setRefundModal] = useState<{
    open: boolean;
    orderId: string;
    reason: string;
  }>({ open: false, orderId: '', reason: '' });

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=10&status=${statusFilter}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      showMessage('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') params.set(key, value);
    else params.delete(key);
    
    if (key !== 'page') params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`/admin/orders?${params.toString()}`);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAccept = async (orderId: string) => {
    if (!window.confirm('Accept this order?')) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('Order accepted successfully', 'success');
        loadOrders();
      } else {
        showMessage(data.error || 'Failed to accept order', 'error');
      }
    } catch {
      showMessage('Something went wrong', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRefundModal = (orderId: string) => {
    setRefundModal({ open: true, orderId, reason: '' });
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
        showMessage('Refund issued successfully', 'success');
        setRefundModal({ open: false, orderId: '', reason: '' });
        loadOrders();
      } else {
        showMessage(data.error || 'Failed to process refund', 'error');
      }
    } catch {
      showMessage('Something went wrong', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {pagination.totalCount} {pagination.totalCount === 1 ? 'order' : 'orders'} total
          </p>
        </div>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => updateParam('status', e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Accepted">Accepted</option>
          <option value="Refunded">Refunded</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No orders found</p>
          <p className="text-gray-300 text-sm mt-1">
            Try changing your filter criteria
          </p>
          {statusFilter !== 'All' && (
            <button
              onClick={() => updateParam('status', 'All')}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
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
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-400 font-mono">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {order.user?.name || 'Deleted user'}
                      </p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {order.items.map(i => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          statusStyles[order.status]
                        }`}
                      >
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
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {order.status === 'Paid' && (
                          <button
                            onClick={() => handleAccept(order._id)}
                            disabled={actionLoading === order._id}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order._id ? '...' : 'Accept'}
                          </button>
                        )}
                        {(order.status === 'Paid' || order.status === 'Accepted') && (
                          <button
                            onClick={() => openRefundModal(order._id)}
                            disabled={actionLoading === order._id}
                            className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
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
          <div className="md:hidden space-y-4 mb-6">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {order.user?.name || 'Deleted user'}
                    </p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}: {order.items.map(i => i.name).join(', ')}</p>
                  <p className="font-bold text-gray-900 mt-1">${order.totalAmount.toFixed(2)}</p>
                </div>

                {order.status === 'Refunded' && order.refundReason && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    Refund reason: {order.refundReason}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>

                <div className="flex gap-2">
                  {order.status === 'Paid' && (
                    <button
                      onClick={() => handleAccept(order._id)}
                      disabled={actionLoading === order._id}
                      className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === order._id ? 'Processing...' : 'Accept Order'}
                    </button>
                  )}
                  {(order.status === 'Paid' || order.status === 'Accepted') && (
                    <button
                      onClick={() => openRefundModal(order._id)}
                      disabled={actionLoading === order._id}
                      className="flex-1 py-2 text-sm font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 border border-gray-100 rounded-2xl">
              <button
                onClick={() => updateParam('page', String(pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-600">
                Page <span className="text-indigo-600 font-bold">{pagination.page}</span> of {pagination.totalPages}
              </span>
              <button
                onClick={() => updateParam('page', String(pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Issue Refund</h2>
            <p className="text-sm text-gray-500 mb-5">
              The customer will receive a full refund. Please provide a reason.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for refund <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Item is out of stock, Unable to fulfill order..."
                value={refundModal.reason}
                onChange={e =>
                  setRefundModal(prev => ({ ...prev, reason: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-50 resize-none transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setRefundModal({ open: false, orderId: '', reason: '' })
                }
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundModal.reason.trim() || actionLoading !== null}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-10 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}