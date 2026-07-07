'use client';

import { useEffect, useState } from 'react';
import PaymentForm from '@/components/PaymentForm';

export default function CheckoutPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, assume last order or pass via search params
    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      fetch(`/api/admin/orders/${lastOrderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data.order);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div>Loading checkout...</div>;
  if (!order) return <div>No order found. Please place an order first.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      <div className="bg-white rounded-2xl p-8 border">
        <PaymentForm 
          orderId={order._id} 
          amount={order.totalAmount} 
          onSuccess={() => {
            alert('Payment Successful! Thank you.');
            window.location.href = '/orders';
          }} 
        />
      </div>
    </div>
  );
}