'use client';

import { useEffect, useState } from 'react';
import PaymentForm from '@/components/PaymentForm';

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      const { orderId } = await params;
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      setOrder(data.order);
      setLoading(false);
    };
    loadOrder();
  }, [params]);

  if (loading) return <div className="text-center py-24">Loading...</div>;
  if (!order) return <div className="text-center py-24">Order not found or not ready for payment.</div>;

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Complete Payment</h1>
      <PaymentForm 
        orderId={order._id} 
        amount={order.totalAmount} 
      />
    </div>
  );
}