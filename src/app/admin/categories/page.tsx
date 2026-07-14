'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  editingId: string;
  name: string;
  description: string;
  image: string;
}

const closedModal: ModalState = {
  open: false, mode: 'add', editingId: '',
  name: '', description: '', image: '',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(closedModal);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openAddModal = () => {
    setModalError('');
    setModal({ ...closedModal, open: true, mode: 'add' });
  };

  const openEditModal = (cat: Category) => {
    setModalError('');
    setModal({
      open: true, mode: 'edit', editingId: cat._id,
      name: cat.name, description: cat.description ?? '', image: cat.image ?? '',
    });
  };

  const handleSave = async () => {
    if (!modal.name.trim()) {
      setModalError('Category name is required.');
      return;
    }
    setModalError('');
    setSaving(true);

    try {
      const url = modal.mode === 'edit'
        ? `/api/admin/categories/${modal.editingId}`
        : '/api/admin/categories';
      const method = modal.mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modal.name.trim(),
          description: modal.description.trim(),
          image: modal.image.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(modal.mode === 'edit' ? 'Category updated!' : 'Category created!', 'success');
        setModal(closedModal);
        loadCategories();
      } else {
        setModalError(data.error || 'Failed to save category');
      }
    } catch {
      setModalError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Products in this category will lose their category.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Category deleted', 'success');
        loadCategories();
      } else {
        showToast('Failed to delete category', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <button onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors self-start sm:self-auto">
          + Add Category
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {toast.text}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-400 text-sm">No categories yet.</p>
            <button onClick={openAddModal}
              className="mt-3 text-sm text-indigo-600 hover:underline">
              Add your first category →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map(cat => (
              <div key={cat._id}
                className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Image */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                      📁
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>
                  )}
                  <p className="text-xs text-gray-300 font-mono mt-0.5">{cat.slug}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditModal(cat)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat._id, cat.name)}
                    disabled={deletingId === cat._id}
                    className="px-3 py-1.5 text-xs font-medium border border-red-100 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                    {deletingId === cat._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.mode === 'edit' ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={() => setModal(closedModal)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Live preview */}
              {modal.image && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <img src={modal.image} alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{modal.name || 'Category preview'}</p>
                    {modal.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{modal.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input type="text" placeholder="e.g. Electronics"
                  value={modal.name}
                  onChange={e => setModal(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClass} autoFocus />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input type="text" placeholder="Short description (optional)"
                  value={modal.description}
                  onChange={e => setModal(prev => ({ ...prev, description: e.target.value }))}
                  className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                <input type="text" placeholder="https://example.com/image.jpg"
                  value={modal.image}
                  onChange={e => setModal(prev => ({ ...prev, image: e.target.value }))}
                  className={inputClass} />
              </div>

              {modalError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {modalError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(closedModal)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !modal.name.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : modal.mode === 'edit' ? 'Update' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}