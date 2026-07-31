'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ab_user', JSON.stringify({ email: formData.email, name: `${formData.firstName} ${formData.lastName}` }));
    window.location.href = '/account';
  };

  return (
    <>
      <Navigation />

      <main className="max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 uppercase">Create Account</h1>
          <p className="text-sm text-gray-600 mt-2">Join Authors Book to manage your literary orders.</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="First"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                placeholder="Last"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Create Account
          </button>

          <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-600">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-black hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
