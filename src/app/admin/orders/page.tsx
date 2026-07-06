import OrdersTable from '../OrdersTable';

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
        <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
      </div>

      <OrdersTable />
    </div>
  );
}