'use client';

import { useEffect, useState } from 'react';
import PaymentForm from '@/components/PaymentForm';
import LocationDetector from '@/components/AddressPicker';

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleAddressDetected = (addressData: any) => {
    setAddress(addressData);
    setIsEditing(false);
  };

  const handleManualEdit = () => {
    setIsEditing(true);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  if (loading) return <div className="text-center py-24">Loading...</div>;
  if (!order) return <div className="text-center py-24">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Delivery Address</h2>
          {address && !isEditing && (
            <button onClick={handleManualEdit} className="text-sm text-indigo-600 hover:underline">
              ✏️ Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleManualSave} className="space-y-4">
            <textarea
              value={address.fullAddress || ''}
              onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
              className="w-full h-32 p-4 border border-gray-300 rounded-xl"
              placeholder="Enter full address"
            />
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl">
              Save Address
            </button>
          </form>
        ) : address ? (
          <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
            <p className="font-medium text-green-800">✅ Address Selected</p>
            <p className="text-sm text-green-700 mt-2 whitespace-pre-line">
              {address.fullAddress}
            </p>
          </div>
        ) : (
          <LocationDetector onAddressFound={handleAddressDetected} />
        )}
      </div>

      {address && (
        <PaymentForm 
          orderId={order._id} 
          amount={order.totalAmount} 
          onSuccess={() => window.location.href = '/orders'} 
        />
      )}
    </div>
  );
}