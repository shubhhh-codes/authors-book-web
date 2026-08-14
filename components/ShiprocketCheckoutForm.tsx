'use client';

import React, { useState } from 'react';
import { shiprocketCheckoutSchema } from '@/lib/validations';
import type { ZodError } from 'zod';

interface CartItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku?: string;
}

interface CheckoutFormProps {
  cartItems: CartItem[];
  customerId?: string;
}

type FieldErrors = Record<string, string>;

export default function ShiprocketCheckoutForm({
  cartItems,
  customerId,
}: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    customerId,
    customer: { name: '', email: '', phone: '' },
    shippingAddress: { street: '', city: '', state: '', postalCode: '', country: 'IN' },
    cartItems,
  });

  const handleChange = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev as any)[section], [field]: value },
    }));
    // Clear per-field error on change
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`${section}.${field}`];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const validated = shiprocketCheckoutSchema.parse(formData);

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Hard-navigate to Shiprocket-hosted checkout
      window.location.href = result.data.checkoutUrl;
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        // ZodError – surface per-field messages
        const ze = err as ZodError;
        const map: FieldErrors = {};
        ze.errors.forEach((e) => {
          map[e.path.join('.')] = e.message;
        });
        setFieldErrors(map);
        setError('Please fix the highlighted fields.');
      } else {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
      console.error('[ShiprocketCheckoutForm] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const fieldError = (key: string) =>
    fieldErrors[key] ? (
      <p className="text-red-600 text-xs mt-1">{fieldErrors[key]}</p>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* ── Order Summary ── */}
        <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h2 className="font-semibold text-base mb-3">Order Summary</h2>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm mb-2 text-gray-700">
              <span>
                {item.title}
                {item.quantity > 1 && (
                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                )}
              </span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-3 mt-3 font-semibold flex justify-between text-gray-900">
            <span>Total</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </section>

        {/* ── Personal Information ── */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Your Information</h2>

          <div className="mb-3">
            <input
              id="customer-name"
              type="text"
              placeholder="Full Name"
              autoComplete="name"
              value={formData.customer.name}
              onChange={(e) => handleChange('customer', 'name', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError('customer.name')}
          </div>

          <div className="mb-3">
            <input
              id="customer-email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
              value={formData.customer.email}
              onChange={(e) => handleChange('customer', 'email', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError('customer.email')}
          </div>

          <div className="mb-3">
            <input
              id="customer-phone"
              type="tel"
              placeholder="Phone Number (10 digits)"
              autoComplete="tel"
              value={formData.customer.phone}
              onChange={(e) => handleChange('customer', 'phone', e.target.value)}
              pattern="[0-9]{10}"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError('customer.phone')}
          </div>
        </section>

        {/* ── Shipping Address ── */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Shipping Address</h2>

          <div className="mb-3">
            <input
              id="shipping-street"
              type="text"
              placeholder="Street Address"
              autoComplete="street-address"
              value={formData.shippingAddress.street}
              onChange={(e) => handleChange('shippingAddress', 'street', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError('shippingAddress.street')}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <input
                id="shipping-city"
                type="text"
                placeholder="City"
                autoComplete="address-level2"
                value={formData.shippingAddress.city}
                onChange={(e) => handleChange('shippingAddress', 'city', e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldError('shippingAddress.city')}
            </div>
            <div>
              <input
                id="shipping-state"
                type="text"
                placeholder="State"
                autoComplete="address-level1"
                value={formData.shippingAddress.state}
                onChange={(e) => handleChange('shippingAddress', 'state', e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fieldError('shippingAddress.state')}
            </div>
          </div>

          <div>
            <input
              id="shipping-postal"
              type="text"
              placeholder="PIN Code (6 digits)"
              autoComplete="postal-code"
              value={formData.shippingAddress.postalCode}
              onChange={(e) =>
                handleChange('shippingAddress', 'postalCode', e.target.value)
              }
              pattern="[0-9]{6}"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldError('shippingAddress.postalCode')}
          </div>
        </section>

        {/* ── Error Banner ── */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md text-sm"
          >
            {error}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          id="checkout-submit"
          type="submit"
          disabled={loading || cartItems.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing…' : `Pay ₹${totalAmount.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
