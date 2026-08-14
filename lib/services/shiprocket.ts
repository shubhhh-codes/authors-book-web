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

let _clockOffset = 0;
let _lastTimeSync = 0;

async function getSyncedDate(): Promise<Date> {
  const now = Date.now();
  // Refresh clock offset every 10 minutes
  if (now - _lastTimeSync > 10 * 60 * 1000) {
    try {
      const res = await axios.get('https://checkout-api.shiprocket.com/', {
        timeout: 3000,
        validateStatus: () => true,
      });
      const serverDateStr = res.headers['date'];
      if (serverDateStr) {
        _clockOffset = new Date(serverDateStr).getTime() - Date.now();
        _lastTimeSync = now;
      }
    } catch {
      // If request fails, fallback to local clock
    }
  }
  return new Date(Date.now() + _clockOffset);
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
        'https://checkout-api.shiprocket.com/api/v1',
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

  /** Generate Fastrr Access Token for one-click checkout initiation */
  async generateAccessToken(
    cartItems: Array<{ variant_id: string; quantity: number }>,
    redirectUrl: string
  ): Promise<{ token: string }> {
    const syncedDate = await getSyncedDate();
    const timestamp = syncedDate.toISOString();
    const payload = {
      cart_data: {
        items: cartItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      },
      redirect_url: redirectUrl,
      timestamp,
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadString)
      .digest('base64');


    try {
      const apiKey = process.env.NEXT_PUBLIC_SRC_API_KEY || '';
      const response = await this.client.post<{ success: boolean; result?: { token: string }; error?: { message: string } }>(
        '/access-token/checkout',
        payloadString,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
            'X-Api-HMAC-SHA256': signature,
            // Override the default client bearer token
            'Authorization': `Bearer ${apiKey}`
          },
        }
      );

      if (!response.data.success || !response.data.result?.token) {
        throw new Error(
          response.data.error?.message || 'Access token response was unsuccessful'
        );
      }

      return response.data.result;
    } catch (error: any) {
      if (error.response?.data) {
        console.error('[Shiprocket] Access token error response:', JSON.stringify(error.response.data, null, 2));
        const detailedError =
          error.response.data.error?.message ||
          error.response.data.message ||
          JSON.stringify(error.response.data.error || error.response.data);
        throw new Error(`[Shiprocket Error] ${detailedError}`);
      }
      console.error('[Shiprocket] Access token generation failed:', error);
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
  generateAccessToken: (
    ...args: Parameters<ShiprocketService['generateAccessToken']>
  ) => getShiprocketService().generateAccessToken(...args),
};

