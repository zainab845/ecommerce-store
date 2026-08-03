'use client';

import { useState, useEffect } from 'react';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  code: '',
  type: 'percentage' as 'percentage' | 'fixed',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  expiryDate: '',
  usageLimit: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editId: string | null }>({
    open: false,
    editId: null,
  });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch {
      showToast('Failed to load coupons', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setModalError('');
    setModal({ open: true, editId: null });
  };

  const openEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderAmount: String(coupon.minOrderAmount),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      usageLimit: String(coupon.usageLimit),
      isActive: coupon.isActive,
    });
    setModalError('');
    setModal({ open: true, editId: coupon._id });
  };

  const handleSave = async () => {
    if (!form.code || !form.value || !form.expiryDate) {
      setModalError('Code, value and expiry date are required');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        expiryDate: form.expiryDate,
        usageLimit: parseInt(form.usageLimit) || 0,
        isActive: form.isActive,
      };

      const url = modal.editId
        ? `/api/admin/coupons/${modal.editId}`
        : '/api/admin/coupons';
      const method = modal.editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(modal.editId ? 'Coupon updated' : 'Coupon created', true);
        setModal({ open: false, editId: null });
        load();
      } else {
        setModalError(data.error || 'Failed to save');
      }
    } catch {
      setModalError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      showToast('Coupon deleted', true);
      load();
    } catch {
      showToast('Failed to delete', false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      load();
    } catch {
      showToast('Failed to update', false);
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          + Create Coupon
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.ok ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-medium">No coupons yet</p>
          <button onClick={openCreate} className="mt-3 text-sm text-indigo-600 hover:underline">
            Create your first coupon →
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  {['Code', 'Discount', 'Min Order', 'Expiry', 'Usage', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => (
                  <tr key={coupon._id} className={`hover:bg-gray-50 transition-colors ${!coupon.isActive || isExpired(coupon.expiryDate) ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-emerald-600">
                        {coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`}
                      </span>
                      {coupon.maxDiscount && (
                        <p className="text-xs text-gray-400">max ${coupon.maxDiscount}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {coupon.minOrderAmount > 0 ? `$${coupon.minOrderAmount}` : 'None'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm ${isExpired(coupon.expiryDate) ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                        {new Date(coupon.expiryDate).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      {isExpired(coupon.expiryDate) && (
                        <p className="text-xs text-red-400">Expired</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {coupon.usedCount}
                        {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' / ∞'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                          coupon.isActive && !isExpired(coupon.expiryDate)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          coupon.isActive && !isExpired(coupon.expiryDate) ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {coupon.isActive && !isExpired(coupon.expiryDate) ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(coupon)}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(coupon._id, coupon.code)}
                          className="px-3 py-1.5 text-xs font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {coupons.map(coupon => (
              <div key={coupon._id} className={`bg-white rounded-2xl border border-gray-100 p-4 ${!coupon.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg text-sm">
                      {coupon.code}
                    </span>
                    <p className="text-sm font-semibold text-emerald-600 mt-1.5">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    coupon.isActive && !isExpired(coupon.expiryDate)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {coupon.isActive && !isExpired(coupon.expiryDate) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(coupon)}
                    className="flex-1 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(coupon._id, coupon.code)}
                    className="flex-1 py-2 text-sm font-medium border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.editId ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button onClick={() => setModal({ open: false, editId: null })}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className={labelClass}>Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className={`${inputClass} uppercase font-mono`}
                />
              </div>

              {/* Type */}
              <div>
                <label className={labelClass}>Discount Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['percentage', 'fixed'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-colors ${
                        form.type === t
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t === 'percentage' ? '% Percentage' : '$ Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div>
                <label className={labelClass}>
                  {form.type === 'percentage' ? 'Discount Percentage (1–100) *' : 'Discount Amount ($) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    {form.type === 'percentage' ? '%' : '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={form.type === 'percentage' ? '100' : undefined}
                    step="0.01"
                    placeholder={form.type === 'percentage' ? '20' : '10.00'}
                    value={form.value}
                    onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              {/* Max discount (percentage only) */}
              {form.type === 'percentage' && (
                <div>
                  <label className={labelClass}>Maximum Discount Cap (optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50 (no cap if empty)"
                      value={form.maxDiscount}
                      onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              )}

              {/* Min order */}
              <div>
                <label className={labelClass}>Minimum Order Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0 (no minimum)"
                    value={form.minOrderAmount}
                    onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              {/* Expiry date */}
              <div>
                <label className={labelClass}>Expiry Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.expiryDate}
                  onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Usage limit */}
              <div>
                <label className={labelClass}>Usage Limit</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (unlimited)"
                  value={form.usageLimit}
                  onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="couponActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Coupon is active and can be used
                </label>
              </div>

              {modalError && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">{modalError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setModal({ open: false, editId: null })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : modal.editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}