'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Product } from '@/types';

interface Props {
  initialData?: Partial<Product>;
  productId?: string;
}

export default function ProductForm({ initialData, productId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price?.toString() ?? '',
    originalPrice: initialData?.originalPrice?.toString() ?? '',
    images: initialData?.images?.join('\n') ?? '',
    category:
      typeof initialData?.category === 'object' && initialData.category !== null
        ? (initialData.category as Category)._id
        : (initialData?.category as string) ?? '',
    stock: initialData?.stock?.toString() ?? '0',
    isFeatured: initialData?.isFeatured ?? false,
  });

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => setError('Failed to load categories'));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    setForm(prev => ({
      ...prev,
      [target.name]:
        target.type === 'checkbox'
          ? (target as HTMLInputElement).checked
          : target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { setError('Valid price is required'); return; }
    if (!form.category) { setError('Please select a category'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        images: form.images
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        category: form.category,
        stock: parseInt(form.stock) || 0,
        isFeatured: form.isFeatured,
      };

      const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Always check content-type before calling .json()
      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType?.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Product Name <span className="text-red-400">*</span></label>
          <input name="name" type="text" placeholder="e.g. Wireless Headphones"
            value={form.name} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category <span className="text-red-400">*</span></label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description <span className="text-red-400">*</span></label>
        <textarea name="description" rows={4} placeholder="Describe this product..."
          value={form.description} onChange={handleChange}
          className={`${inputClass} resize-none`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className={labelClass}>Price (USD) <span className="text-red-400">*</span></label>
          <input name="price" type="number" step="0.01" min="0" placeholder="0.00"
            value={form.price} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Original Price</label>
          <input name="originalPrice" type="number" step="0.01" min="0" placeholder="0.00 (optional)"
            value={form.originalPrice} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Stock <span className="text-red-400">*</span></label>
          <input name="stock" type="number" min="0" placeholder="0"
            value={form.stock} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Image URLs</label>
        <textarea name="images" rows={3}
          placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
          value={form.images} onChange={handleChange}
          className={`${inputClass} resize-none`} />
        <p className="mt-1.5 text-xs text-gray-400">One URL per line</p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <input name="isFeatured" type="checkbox" id="isFeatured"
          checked={form.isFeatured} onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        <div>
          <label htmlFor="isFeatured" className="text-sm font-medium text-gray-900 cursor-pointer">
            Feature this product
          </label>
          <p className="text-xs text-gray-500 mt-0.5">Featured products appear on the home page</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : productId ? 'Update Product' : 'Add Product'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}