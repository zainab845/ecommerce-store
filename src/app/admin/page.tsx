import Link from 'next/link';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import mongoose from 'mongoose';
import NotificationBell from './NotificationBell';
import RevenueChart from '@/components/admin/RevenueChart';

// ─── Stats ────────────────────────────────────────────────────────────────────
async function getDashboardData() {
  await dbConnect();

  const UserModel =
    mongoose.models.User ||
    mongoose.model('User', new mongoose.Schema({ role: String }));

  const ProductModel =
    mongoose.models.Product ||
    mongoose.model('Product', new mongoose.Schema({}));

  const [totalOrders, totalUsers, totalProducts, allOrders, recentOrders] =
    await Promise.all([
      Order.countDocuments(),
      UserModel.countDocuments({ role: 'user' }),
      ProductModel.countDocuments(),
      Order.find().select('totalAmount createdAt').lean(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .select('user totalAmount status createdAt')
        .lean(),
    ]);

  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + (o.totalAmount as number || 0),
    0
  );

  return { totalOrders, totalUsers, totalProducts, totalRevenue, recentOrders, allOrders };
}

// ─── Revenue aggregation ──────────────────────────────────────────────────────
async function getRevenueData() {
  await dbConnect();

  const now = new Date();
  const currentYear = now.getFullYear();

  // Monthly — current year
  const monthlyRaw = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(currentYear, 0, 1) } } },
    { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthly = monthNames.map((name, idx) => {
    const found = monthlyRaw.find((d: any) => d._id === idx + 1);
    return { name, revenue: found?.revenue ?? 0 };
  });

  // Quarterly — derived from monthly
  const quarterly = [
    { name: 'Q1', revenue: monthly.slice(0, 3).reduce((s, d) => s + d.revenue, 0) },
    { name: 'Q2', revenue: monthly.slice(3, 6).reduce((s, d) => s + d.revenue, 0) },
    { name: 'Q3', revenue: monthly.slice(6, 9).reduce((s, d) => s + d.revenue, 0) },
    { name: 'Q4', revenue: monthly.slice(9, 12).reduce((s, d) => s + d.revenue, 0) },
  ];

  // Yearly — past 5 years
  const yearlyRaw = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(currentYear - 4, 0, 1) } } },
    { $group: { _id: { $year: '$createdAt' }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);

  const yearly = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 4 + i;
    const found = yearlyRaw.find((d: any) => d._id === year);
    return { name: String(year), revenue: found?.revenue ?? 0 };
  });

  return { monthly, quarterly, yearly };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  const [
    { totalOrders, totalUsers, totalProducts, totalRevenue, recentOrders },
    revenueData,
  ] = await Promise.all([getDashboardData(), getRevenueData()]);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Orders', value: totalOrders, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Users', value: totalUsers, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Products', value: totalProducts, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Overview of your store</p>
        </div>
        <NotificationBell />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl p-4 sm:p-6 border border-white`}>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-2xl sm:text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* Recent Orders */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders"
              className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-400 text-sm">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(recentOrders as any[]).map((order) => (
                <div key={String(order._id)}
                  className="flex justify-between items-center text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {order.user?.name || 'Customer'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      ${(order.totalAmount as number).toFixed(2)}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'Accepted'
                      ? 'bg-blue-100 text-blue-700'
                      : order.status === 'Cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <RevenueChart
            monthly={revenueData.monthly}
            quarterly={revenueData.quarterly}
            yearly={revenueData.yearly}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h2 className="font-semibold text-base text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '+ Add Product', href: '/admin/products/new', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            { label: '+ Add Category', href: '/admin/categories', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            { label: '↗ View Store', href: '/', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
            { label: '✉ Messages', href: '/admin/contact', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-colors text-center ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}