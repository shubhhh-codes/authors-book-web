'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ type: 'success', msg: data.message });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to submit form' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Something went wrong. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 uppercase">
            Contact Us
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question about a book order, custom bookmarks, or partnerships? We&rsquo;d love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Contact Info Sidebar */}
          <div className="md:col-span-1 space-y-6 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Us</h3>
              <a
                href="mailto:authorsbook01@gmail.com"
                className="text-sm font-semibold text-gray-900 hover:text-black transition-colors underline decoration-gray-300"
              >
                authorsbook01@gmail.com
              </a>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Phone / WhatsApp</h3>
              <a
                href="tel:+919265795380"
                className="text-sm font-semibold text-gray-900 hover:text-black transition-colors"
              >
                +91 9265795380
              </a>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Support Hours</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Monday to Saturday<br />
                10:00 AM – 6:00 PM (IST)
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            {status && (
              <div
                className={`p-4 rounded-xl text-sm mb-6 ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {status.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="How can we help you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
