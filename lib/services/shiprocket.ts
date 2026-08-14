/**
 * Shiprocket Checkout (SRC) API Service
 *
 * Wraps the SRC REST API:
 * https://documenter.getpostman.com/view/25617008/2sB34bL3ig
 *
 * Env vars required (add to .env.local):
 *   NEXT_PUBLIC_SRC_API_KEY      – Bearer token / API key
 *   SRC_SECRET_KEY               – Webhook HMAC secret
 *   NEXT_PUBLIC_SRC_CHANNEL_ID   – SRC channel ID
 *   SRC_API_BASE_URL             – Optional override (defaults to production)
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import type { SRCSessionResponse } from '@/lib/types';

interface SRCCreateSessionPayload {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_shipping_address: {
    country_code: string;
    state: string;
    city: string;
    address_line_1: string;
    address_line_2?: string;
    postal_code: string;
  };
  customer_billing_address?: {
    country_code: string;
    state: string;
    city: string;
    address_line_1: string;
    address_line_2?: string;
    postal_code: string;
  };
  line_items: Array<{
    sku?: string;
    title: string;
    quantity: number;
    amount: number;
  }>;
  channel_id: string;
  return_url: string;
  notify_url: string;
  udf1?: string;
}

class ShiprocketService {
  private client: AxiosInstance;
  private secretKey: string;
  private channelId: string;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_SRC_API_KEY || '';
    this.secretKey = process.env.SRC_SECRET_KEY || '';
    this.channelId = process.env.NEXT_PUBLIC_SRC_CHANNEL_ID || '';

    if (!apiKey || !this.secretKey || !this.channelId) {
      throw new Error(
        '[Shiprocket] Missing env vars: NEXT_PUBLIC_SRC_API_KEY, SRC_SECRET_KEY, NEXT_PUBLIC_SRC_CHANNEL_ID'
      );
    }

    this.client = axios.create({
      baseURL:
        process.env.SRC_API_BASE_URL ||
        'https://checkout-api.shiprocket.in/api/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10_000,
    });
  }

  /** Create a new SRC checkout session */
  async createSession(
    payload: SRCCreateSessionPayload
  ): Promise<SRCSessionResponse> {
    if (!payload.order_id || !payload.order_amount) {
      throw new Error('[Shiprocket] order_id and order_amount are required');
    }

    try {
      const response = await this.client.post<SRCSessionResponse>(
        '/session/create',
        payload
      );

      if (!response.data.success) {
        throw new Error(
          `[Shiprocket] ${
            response.data.error?.message || 'Failed to create session'
          }`
        );
      }

      console.log(
        `[Shiprocket] Session created: ${response.data.data?.session_id}`
      );
      return response.data;
    } catch (error) {
      console.error('[Shiprocket] Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Verify the HMAC-SHA256 signature on an incoming webhook.
   * Returns true only when the computed digest matches the supplied signature.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const computed = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawBody)
      .digest('hex');

    const isValid = computed === signature;
    if (!isValid) {
      console.warn('[Shiprocket] Webhook signature verification failed');
    }
    return isValid;
  }

  /** Fetch order details from SRC */
  async getOrderDetails(orderId: string): Promise<unknown> {
    try {
      const response = await this.client.get(`/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`[Shiprocket] Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  }

  /** Cancel an order via SRC */
  async cancelOrder(orderId: string): Promise<unknown> {
    try {
      const response = await this.client.post(`/order/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`[Shiprocket] Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }
}

// Singleton – instantiated lazily so the env check doesn't run at build time
let _instance: ShiprocketService | null = null;

function getShiprocketService(): ShiprocketService {
  if (!_instance) {
    _instance = new ShiprocketService();
  }
  return _instance;
}

export const shiprocketService = {
  createSession: (...args: Parameters<ShiprocketService['createSession']>) =>
    getShiprocketService().createSession(...args),
  verifyWebhookSignature: (
    ...args: Parameters<ShiprocketService['verifyWebhookSignature']>
  ) => getShiprocketService().verifyWebhookSignature(...args),
  getOrderDetails: (
    ...args: Parameters<ShiprocketService['getOrderDetails']>
  ) => getShiprocketService().getOrderDetails(...args),
  cancelOrder: (...args: Parameters<ShiprocketService['cancelOrder']>) =>
    getShiprocketService().cancelOrder(...args),
};
