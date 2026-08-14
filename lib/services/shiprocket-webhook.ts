/**
 * Shiprocket Webhook Event Processor
 *
 * Handles order lifecycle events emitted by Shiprocket Checkout:
 *  - order.confirmed  → mark paid, send tracking WhatsApp
 *  - order.failed     → mark failed
 *  - order.cancelled  → mark cancelled
 *
 * Note: `order.created` is informational and does not mutate DB state here
 * because we already create the order record in the create-session API route.
 */

import Order from '@/lib/schemas/Order';
import type { SRCWebhookEvent } from '@/lib/types';
import { sendOrderTrackingLink } from '@/lib/whatsapp';

type WebhookResult =
  | { success: true; action: string }
  | { success: false; error: string };

export async function processShiprocketWebhook(
  payload: SRCWebhookEvent
): Promise<WebhookResult> {
  console.log(
    `[Webhook] Processing event: ${payload.event} | Order: ${payload.data.order_id}`
  );

  try {
    const order = await Order.findOne({
      $or: [
        { shiprocketOrderId: payload.data.order_id },
        { orderNumber: payload.data.order_id },
      ],
    });

    if (!order) {
      console.warn(
        `[Webhook] Order not found for Shiprocket ID: ${payload.data.order_id}`
      );
      return { success: false, error: 'Order not found' };
    }

    switch (payload.event) {
      case 'order.created':
        // Already persisted in create-session route; no further action needed.
        console.log(`[Webhook] order.created acknowledged: ${order._id}`);
        return { success: true, action: 'order_created_ack' };

      case 'order.confirmed':
        return handleOrderConfirmed(order, payload.data);

      case 'order.failed':
        return handleOrderFailed(order, payload.data);

      case 'order.cancelled':
        return handleOrderCancelled(order, payload.data);

      default:
        console.warn(`[Webhook] Unknown event: ${payload.event}`);
        return { success: false, error: 'Unknown event type' };
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    throw error;
  }
}

// ── Private handlers ──────────────────────────────────────────────────────────

async function handleOrderConfirmed(
  order: Awaited<ReturnType<typeof Order.findOne>>,
  data: SRCWebhookEvent['data']
): Promise<WebhookResult> {
  order!.status = 'confirmed';
  order!.paymentStatus = 'completed';
  order!.paidAt = new Date();
  if (data.transaction_id) {
    order!.transactionId = data.transaction_id;
  }
  await order!.save();

  console.log(`[Order] Confirmed: ${order!._id}`);

  // Resolve phone from nested customer or legacy flat field
  const phone: string | undefined =
    order!.customer?.phone || order!.customerPhone;

  if (phone) {
    try {
      const orderId: string = order!.orderNumber || order!.bookingId || String(order!._id);
      await sendOrderTrackingLink(phone, {
        orderId,
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`,
      });
    } catch (err) {
      // Non-fatal: log but don't propagate – order is already confirmed.
      console.error('[WhatsApp] Failed to send tracking link:', err);
    }
  }

  return { success: true, action: 'order_confirmed' };
}

async function handleOrderFailed(
  order: Awaited<ReturnType<typeof Order.findOne>>,
  _data: SRCWebhookEvent['data']
): Promise<WebhookResult> {
  order!.status = 'failed';
  order!.paymentStatus = 'failed';
  await order!.save();

  console.log(`[Order] Failed: ${order!._id}`);
  return { success: true, action: 'order_failed' };
}

async function handleOrderCancelled(
  order: Awaited<ReturnType<typeof Order.findOne>>,
  _data: SRCWebhookEvent['data']
): Promise<WebhookResult> {
  order!.status = 'cancelled';
  await order!.save();

  console.log(`[Order] Cancelled: ${order!._id}`);
  return { success: true, action: 'order_cancelled' };
}
