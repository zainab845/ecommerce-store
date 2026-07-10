import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Payment Cancelled</h1>
      <p className="mt-3 text-gray-500 text-lg">
        No worries — your cart is still saved and nothing was charged.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/cart"
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Return to Cart
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}