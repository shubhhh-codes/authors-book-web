'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AccountPage() {
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ab_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ab_user');
    window.location.href = '/';
  };

  return (
    <>
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 uppercase">My Account</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold border border-gray-300 hover:border-black px-4 py-2 rounded-full transition-colors self-start sm:self-auto"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order History */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 uppercase">Order History</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm">
              <p className="font-medium text-gray-900">You haven&rsquo;t placed any orders yet.</p>
              <p className="text-xs mt-1 text-gray-500">When you place an order, it will appear here.</p>
              <Link
                href="/shop"
                className="inline-block mt-4 bg-black text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>

          {/* Account Details & Addresses */}
          <div className="md:col-span-1 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 uppercase">Account Details</h2>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Account Email</p>
                <p className="font-semibold text-gray-900 mt-0.5">{user?.email || 'Guest User'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Default Address</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  No default address saved yet. Addresses are saved automatically during checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
