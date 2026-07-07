'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutForm = ({ orderId, amount, onSuccess }: { 
  orderId: string; 
  amount: number; 
  onSuccess?: () => void; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const { clientSecret } = await res.json();

      if (!stripe || !elements || !clientSecret) throw new Error('Payment setup failed');

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) throw stripeError;

      alert('Payment successful! Thank you for your purchase.');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="p-4 border rounded-xl bg-white">
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#333' }
            }
          }} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Processing Payment...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default function PaymentForm({ orderId, amount, onSuccess }: { 
  orderId: string; 
  amount: number; 
  onSuccess?: () => void; 
}) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm orderId={orderId} amount={amount} onSuccess={onSuccess} />
    </Elements>
  );
}