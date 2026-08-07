'use client';

import { useState, useEffect } from 'react';
import type { Discount } from '@/lib/types';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    value: '',
    minSubtotal: '0',
  });

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts');
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      }
    } catch (err) {
      console.error('Fetch discounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ code: '', discountType: 'percentage', value: '', minSubtotal: '0' });
        fetchDiscounts();
      } else {
        alert('Failed to create discount code');
      }
    } catch {
      alert('Error creating discount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Discounts</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create and manage promotional discount codes for your store.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
        >
          <span>+ Create discount</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
            Active Codes ({discounts.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-medium">Loading discounts...</div>
        ) : discounts.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <p className="text-base font-semibold text-gray-900">No discount codes created yet</p>
            <p className="text-xs text-gray-500">Create your first promo code (e.g. READ10) to offer discounts to customers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Discount Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Min. Subtotal</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {discounts.map((d: Discount) => (
                  <tr key={d._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 tracking-wide">{d.code}</td>
                    <td className="py-3.5 px-4 text-gray-600 capitalize">{d.discountType}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {d.discountType === 'percentage' ? `${d.value}%` : `₹${d.value}`}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">₹{d.minSubtotal}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-base font-bold text-gray-900">Create Discount Code</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Discount Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. READ10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase font-bold tracking-wider"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="flat">Fixed Amount Off (₹)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Discount Value *</label>
                <input
                  type="number"
                  required
                  placeholder={formData.discountType === 'percentage' ? '10 (%)' : '100 (₹)'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.minSubtotal}
                  onChange={(e) => setFormData({ ...formData, minSubtotal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
