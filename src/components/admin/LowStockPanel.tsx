'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StockProduct {
  _id: string;
  name: string;
  stock: number;
  images?: string[];
}

export default function LowStockPanel() {
  const [lowStock, setLowStock] = useState<StockProduct[]>([]);
  const [outOfStock, setOutOfStock] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/admin/inventory/low-stock');
      const data = await res.json();
      setLowStock(data.lowStock ?? []);
      setOutOfStock(data.outOfStock ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStockUpdate = async (productId: string) => {
    const newStock = parseInt(stockInputs[productId] ?? '0');
    if (isNaN(newStock) || newStock < 0) return;

    setUpdatingId(productId);
    try {
      const res = await fetch('/api/admin/inventory/update-stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock: newStock }),
      });
      if (res.ok) {
        setToast('Stock updated');
        setTimeout(() => setToast(''), 2500);
        setStockInputs(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        load();
      }
    } catch {}
    finally { setUpdatingId(null); }
  };

  if (!loading && lowStock.length === 0 && outOfStock.length === 0) return null;

  const allProducts = [
    ...outOfStock.map(p => ({ ...p, urgent: true })),
    ...lowStock.map(p => ({ ...p, urgent: false })),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Inventory Alerts</h2>
            <p className="text-xs text-gray-400">
              {outOfStock.length} out of stock · {lowStock.length} low stock
            </p>
          </div>
        </div>
        <Link href="/admin/products" className="text-xs text-indigo-600 hover:underline font-medium">
          Manage all →
        </Link>
      </div>

      {toast && (
        <div className="px-5 py-2 bg-green-50 text-green-700 text-xs font-medium border-b border-green-100">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="p-5 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {allProducts.map(product => (
            <div key={product._id} className="flex items-center gap-4 px-5 sm:px-6 py-3">
              {/* Product image */}
              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                )}
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  product.urgent
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {product.urgent ? 'Out of Stock' : `Only ${product.stock} left`}
                </span>
              </div>

              {/* Quick stock update */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  value={stockInputs[product._id] ?? ''}
                  onChange={e => setStockInputs(prev => ({ ...prev, [product._id]: e.target.value }))}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => handleStockUpdate(product._id)}
                  disabled={!stockInputs[product._id] || updatingId === product._id}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {updatingId === product._id ? '...' : 'Update'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}