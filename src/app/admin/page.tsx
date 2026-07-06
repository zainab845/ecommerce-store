import Link from 'next/link';
import { getDashboardStats } from '@/lib/controllers/adminController';

function OrdersTable() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="py-3 font-medium text-gray-500">Order ID</th>
              <th className="py-3 font-medium text-gray-500">Customer</th>
              <th className="py-3 font-medium text-gray-500">Amount</th>
              <th className="py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 text-gray-600">-</td>
              <td className="py-3 text-gray-600">-</td>
              <td className="py-3 text-gray-600">-</td>
              <td className="py-3 text-gray-600">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function getStats() {
  const data = await getDashboardStats();
  return data;
}

export default async function AdminDashboard() {
  const { totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders } = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening in your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'text-emerald-600' },
          { label: 'Total Orders', value: totalOrders, color: 'text-blue-600' },
          { label: 'Total Users', value: totalUsers, color: 'text-violet-600' },
          { label: 'Total Products', value: totalProducts, color: 'text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders + All Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {recentOrders.map((order: any) => (
              <div key={order._id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{order.user?.name || 'Customer'}</p>
                  <p className="text-gray-500">${order.totalAmount}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'Accepted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* All Orders Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">All Orders</h2>
            <Link href="/admin/orders" className="text-indigo-600 hover:underline text-sm">
              View All →
            </Link>
          </div>
          <OrdersTable />
        </div>
      </div>
    </div>
  );
}