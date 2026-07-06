'use client';

import { useState, useEffect } from 'react';

interface Order {
  _id: string;
  user: { name: string; email: string };
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Paid' | 'Cancelled';
  createdAt: string;
  items: any[];
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchOrders(); // Refresh list
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <p className="text-gray-500">Loading orders...</p>;

  return (
<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full min-w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order ID</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {orders.map((order) => (
          <tr key={order._id} className="hover:bg-gray-50">
            <td className="px-4 py-4 text-sm font-mono text-gray-500">
              {order._id.slice(-8)}
            </td>
            <td className="px-4 py-4">
              <div className="text-sm font-medium">{order.user?.name || 'Customer'}</div>
              <div className="text-xs text-gray-500">{order.user?.email}</div>
            </td>
            <td className="px-4 py-4 font-medium">${order.totalAmount}</td>
            <td className="px-4 py-4">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                order.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                order.status === 'Accepted' ? 'bg-blue-100 text-blue-700' : 
                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status}
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
              {order.status === 'Pending' && (
                <>
                  <button onClick={() => updateStatus(order._id, 'Accepted')} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Accept</button>
                  <button onClick={() => updateStatus(order._id, 'Cancelled')} className="text-red-600 hover:text-red-700 text-sm font-medium">Reject</button>
                </>
              )}
              {order.status === 'Accepted' && (
                <button onClick={() => updateStatus(order._id, 'Paid')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Mark Paid</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {orders.length === 0 && (
    <div className="text-center py-12 text-gray-400">
      No orders yet. Create an order from the store to see it here.
    </div>
  )}
</div>
  );
}