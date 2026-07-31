'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist session
    localStorage.setItem('ab_user', JSON.stringify({ email }));
    window.location.href = '/account';
  };

  return (
    <>
      <Navigation />

      <main className="max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 uppercase">Customer Login</h1>
          <p className="text-sm text-gray-600 mt-2">Sign in to view your orders and saved shipping addresses.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>

          <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
            <p>
              Don&rsquo;t have an account?{' '}
              <Link href="/register" className="font-semibold text-black hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
