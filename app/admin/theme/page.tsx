'use client';

import { useState, useEffect } from 'react';

export default function AdminThemeCustomizerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    announcementText: '',
    announcementEmail: '',
    announcementPhone: '',
    aboutHeading: '',
    aboutQuote: '',
    aboutText: '',
  });

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch('/api/admin/theme');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            announcementText: data.announcementText || '',
            announcementEmail: data.announcementEmail || '',
            announcementPhone: data.announcementPhone || '',
            aboutHeading: data.aboutHeading || '',
            aboutQuote: data.aboutQuote || '',
            aboutText: data.aboutText || '',
          });
        }
      } catch (err) {
        console.error('Fetch theme error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('✅ Theme settings saved successfully!');
      } else {
        setStatus('❌ Failed to save theme settings');
      }
    } catch {
      setStatus('❌ Error saving theme settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-500 font-medium">Loading theme customizer...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Theme Customizer</h1>
          <p className="text-xs text-gray-500 mt-1">
            Customize top announcement banner, brand messaging, and About Us section dynamically.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>

      {status && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
          {status}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Top Announcement Bar Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Announcement Bar</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Message</label>
            <input
              type="text"
              value={formData.announcementText}
              onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
              placeholder="e.g. ✨ Special Offer: Free shipping on orders above ₹500 across India!"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={formData.announcementEmail}
                onChange={(e) => setFormData({ ...formData, announcementEmail: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={formData.announcementPhone}
                onChange={(e) => setFormData({ ...formData, announcementPhone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* About Us Section Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">About Us Section</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Section Heading</label>
            <input
              type="text"
              value={formData.aboutHeading}
              onChange={(e) => setFormData({ ...formData, aboutHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Featured Quote</label>
            <input
              type="text"
              value={formData.aboutQuote}
              onChange={(e) => setFormData({ ...formData, aboutQuote: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Manifesto Body Text</label>
            <textarea
              rows={4}
              value={formData.aboutText}
              onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs leading-relaxed"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
