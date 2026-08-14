/**
 * Shiprocket Order Lifecycle Webhook Endpoint
 *
 * Receives real-time order events (order.created, order.confirmed, order.failed, order.cancelled)
 * from Shiprocket Checkout with constant-time HMAC-SHA256 signature verification and idempotency queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { processShiprocketWebhook } from '@/lib/services/shiprocket-webhook';
import { logCatalogEvent, captureWebhookError } from '@/lib/logger';
import type { SRCWebhookEvent } from '@/lib/types';

// In-memory queue to prevent duplicate concurrent order processing
const orderProcessingQueue = new Set<string>();

/**
 * Constant-time HMAC-SHA256 signature verification.
 */
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const computedHmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const computedBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');

    const sigBuffer = Buffer.from(signature, 'utf8');

    // Test both hex and base64 formats
    const hexBuffer = Buffer.from(computedHmac, 'utf8');
    if (sigBuffer.length === hexBuffer.length && crypto.timingSafeEqual(sigBuffer, hexBuffer)) {
      return true;
    }

    const base64Buffer = Buffer.from(computedBase64, 'utf8');
    if (sigBuffer.length === base64Buffer.length && crypto.timingSafeEqual(sigBuffer, base64Buffer)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    await connectDB();

    const signature =
      request.headers.get('X-Shiprocket-Signature') ||
      request.headers.get('X-Api-HMAC-SHA256') ||
      request.headers.get('x-shiprocket-signature');

    const secretKey =
      process.env.SHIPROCKET_WEBHOOK_SECRET ||
      process.env.SRC_SECRET_KEY ||
      process.env.SHIPROCKET_SECRET_KEY;

    const rawBody = await request.text();

    // Verify signature if secret is configured
    if (secretKey) {
      if (!signature) {
        logCatalogEvent({
          type: 'webhook_received',
          error: 'Missing signature header',
          metadata: { ip },
        });
        return NextResponse.json(
          { success: false, error: 'Missing signature header' },
          { status: 401 }
        );
      }

      const isValid = verifySignature(rawBody, signature, secretKey);
      if (!isValid) {
        logCatalogEvent({
          type: 'webhook_received',
          error: 'Invalid signature mismatch',
          metadata: { ip },
        });
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody) as SRCWebhookEvent;
    const orderId = payload?.data?.order_id
      ? String(payload.data.order_id)
      : payload?.order_id
        ? String(payload.order_id)
        : '';

    // Idempotency check: prevent duplicate simultaneous processing
    if (orderId && orderProcessingQueue.has(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Order is currently processing' },
        { status: 409 }
      );
    }

    if (orderId) orderProcessingQueue.add(orderId);

    try {
      logCatalogEvent({
        type: 'webhook_received',
        orderId,
        metadata: { event: payload.event || payload.status, ip },
      });

      const result = await processShiprocketWebhook(payload);

      if (!result.success) {
        logCatalogEvent({
          type: 'order_failed',
          orderId,
          error: result.error,
        });

        return NextResponse.json(
          {
            error: result.error,
            variant_id: result.variant_id,
            sku: result.sku,
          },
          { status: 400 }
        );
      }

      logCatalogEvent({
        type: 'order_processed',
        orderId,
        metadata: { event: payload.event || payload.status, result },
      });

      return NextResponse.json({ success: true, result }, { status: 200 });
    } finally {
      if (orderId) orderProcessingQueue.delete(orderId);
    }
  } catch (error: any) {
    captureWebhookError('order_webhook_endpoint', error, { ip });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Health check & verification ping endpoint.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'active',
    service: 'Shiprocket Order Webhook Receiver',
    timestamp: new Date().toISOString(),
  });
}
