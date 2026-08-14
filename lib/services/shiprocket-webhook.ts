/**
 * Shiprocket Webhook Event Processor
 *
 * Handles order lifecycle events emitted by Shiprocket Checkout:
 *  - order.created    → acknowledges or creates order
 *  - order.confirmed  → mark paid, update inventory, send tracking WhatsApp
 *  - order.failed     → mark failed
 *  - order.cancelled  → mark cancelled
 */

import Order from '@/lib/schemas/Order';
import Product from '@/lib/schemas/Product';
import type { SRCWebhookEvent, SRCWebhookItem } from '@/lib/types';
import { sendOrderTrackingLink } from '@/lib/whatsapp';
import { findVariantByAnyId } from './variantMapping';

export type WebhookResult =
  | { success: true; action: string; orderId?: string }
  | { success: false; error: string; variant_id?: unknown; sku?: unknown };

/**
 * Multi-strategy variant lookup helper for incoming order line items.
 *
 * Strategy 1: Check variant mapping table with variant_id & sku
 * Strategy 2: Parse variant_id as local numeric ID
 * Strategy 3: Look up by SKU directly
 * Strategy 4: Fallback to Product collection query & auto-cache mapping
 */
export async function findVariantForOrder(item: SRCWebhookItem) {
  const variantIdStr = item.variant_id != null ? String(item.variant_id).trim() : undefined;
  const skuStr = item.sku != null ? String(item.sku).trim() : undefined;

  // Strategy 1: Try variant mapping table
  const mapping = await findVariantByAnyId(variantIdStr, skuStr, undefined);
  if (mapping) {
    return mapping;
  }

  // Strategy 2: Try parsing as numeric ID
  if (variantIdStr) {
    const numId = parseInt(variantIdStr, 10);
    if (!isNaN(numId)) {
      const mapping2 = await findVariantByAnyId(undefined, undefined, numId);
      if (mapping2) return mapping2;
    }
  }

  // Strategy 3: Try SKU directly on products / mappings
  if (skuStr) {
    const mapping3 = await findVariantByAnyId(undefined, skuStr, undefined);
    if (mapping3) return mapping3;
  }

  return null;
}

export async function processShiprocketWebhook(
  payload: SRCWebhookEvent
): Promise<WebhookResult> {
  const orderId =
    payload.data?.order_id ||
    payload.order_id ||
    (payload as any).id ||
    '';

  const rawEvent =
    payload.event ||
    (payload.status === 'SUCCESS' ? 'order.confirmed' : payload.status === 'FAILED' ? 'order.failed' : payload.status === 'CANCELLED' ? 'order.cancelled' : 'order.created');

  console.log(`[Webhook] Processing event: ${rawEvent} | Order: ${orderId}`);

  try {
    let order = orderId
      ? await Order.findOne({
          $or: [
            { shiprocketOrderId: orderId },
            { orderNumber: orderId },
            { bookingId: orderId },
          ],
        })
      : null;

    const items: SRCWebhookItem[] =
      payload.cart_data?.items ||
      payload.data?.cart_data?.items ||
      (payload as any).items ||
      [];

    const resolvedItems: Array<{
      productId?: any;
      handle: string;
      title: string;
      sku: string;
      price: number;
      quantity: number;
    }> = [];

    // If items are included, validate all variants via multi-strategy lookup
    for (const item of items) {
      const mapping = await findVariantForOrder(item);

      if (!mapping) {
        console.error('⚠️ Variant not found for order webhook', {
          variant_id: item.variant_id,
          sku: item.sku,
          received_payload: item,
        });

        return {
          success: false,
          error: 'Variant not found',
          variant_id: item.variant_id,
          sku: item.sku,
        };
      }

      // Look up product in DB to get title, handle, price
      const product = await Product.findOne({
        $or: [
          { shiprocketVariantId: mapping.shiprocketVariantId || String(mapping.localVariantId) },
          { sku: mapping.sku },
          ...(mapping.localProductId ? [{ _id: mapping.localProductId }] : []),
        ],
      }).lean();

      const itemPrice = typeof item.price === 'number' ? item.price : (product?.price || 0);
      const itemTitle = item.title || product?.title || 'Book';
      const itemHandle = product?.handle || '';
      const itemQty = Number(item.quantity) || 1;

      resolvedItems.push({
        productId: product?._id,
        handle: itemHandle,
        title: itemTitle,
        sku: mapping.sku,
        price: itemPrice,
        quantity: itemQty,
      });

      // Update inventory on confirmed status
      if (product && (rawEvent === 'order.confirmed' || payload.status === 'SUCCESS')) {
        try {
          await Product.updateOne(
            { _id: product._id, 'inventory.quantity': { $gte: itemQty } },
            { $inc: { 'inventory.quantity': -itemQty } }
          );
        } catch (invErr) {
          console.warn('[Webhook] Failed to decrement inventory:', invErr);
        }
      }
    }

    // If order does not exist in DB yet, create it from webhook payload
    if (!order && orderId) {
      const customerName = (payload as any).customer_name || (payload as any).customer?.name || (payload.data as any)?.customer?.name || 'Customer';
      const customerEmail = payload.email || (payload as any).customer?.email || (payload.data as any)?.customer?.email || '';
      const customerPhone = payload.phone || (payload as any).customer?.phone || (payload.data as any)?.customer?.phone || '';
      const total = payload.total_amount_payable || payload.data?.order_amount || (payload as any).total_amount || 0;
      const shippingAddr = (payload as any).shipping_address || (payload.data as any)?.shipping_address || {};

      order = await Order.create({
        bookingId: orderId,
        orderNumber: orderId,
        shiprocketOrderId: orderId,
        customerEmail,
        customerName,
        customerPhone,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        items: resolvedItems.length > 0 ? resolvedItems : undefined,
        subtotal: total,
        total,
        totalAmount: total,
        shippingAddress: {
          street: shippingAddr.street || shippingAddr.address1 || '',
          city: shippingAddr.city || '',
          state: shippingAddr.state || '',
          zip: shippingAddr.zip || shippingAddr.postal_code || '',
        },
        paymentGateway: 'shiprocket',
        paymentStatus: rawEvent === 'order.confirmed' || payload.status === 'SUCCESS' ? 'completed' : 'pending',
        status: rawEvent === 'order.confirmed' || payload.status === 'SUCCESS' ? 'confirmed' : 'pending',
        timestamps: {
          created: new Date(),
          paid: rawEvent === 'order.confirmed' || payload.status === 'SUCCESS' ? new Date() : undefined,
        },
      });

      console.log(`[Order] Created via webhook: ${order._id} (${orderId})`);
    }

    if (!order) {
      console.warn(`[Webhook] Order not found for Shiprocket ID: ${orderId}`);
      return { success: false, error: 'Order not found' };
    }

    // Attach resolved items if order was empty
    if (resolvedItems.length > 0 && (!order.items || order.items.length === 0)) {
      order.items = resolvedItems as any;
      await order.save();
    }

    switch (rawEvent) {
      case 'order.created':
        console.log(`[Webhook] order.created acknowledged: ${order._id}`);
        return { success: true, action: 'order_created_ack', orderId };

      case 'order.confirmed':
        return handleOrderConfirmed(order, payload.data || payload);

      case 'order.failed':
        return handleOrderFailed(order, payload.data || payload);

      case 'order.cancelled':
        return handleOrderCancelled(order, payload.data || payload);

      default:
        console.log(`[Webhook] Event processed: ${rawEvent}`);
        return { success: true, action: 'order_processed', orderId };
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    throw error;
  }
}

// ── Private handlers ──────────────────────────────────────────────────────────

async function handleOrderConfirmed(
  order: any,
  data: any
): Promise<WebhookResult> {
  order.status = 'confirmed';
  order.paymentStatus = 'completed';
  order.paidAt = new Date();
  if (data?.transaction_id) {
    order.transactionId = data.transaction_id;
  }
  await order.save();

  console.log(`[Order] Confirmed: ${order._id}`);

  // Resolve phone from nested customer or legacy flat field
  const phone: string | undefined =
    order.customer?.phone || order.customerPhone;

  if (phone) {
    try {
      const orderId: string = order.orderNumber || order.bookingId || String(order._id);
      await sendOrderTrackingLink(phone, {
        orderId,
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://authorsbook.vercel.app'}/track/${orderId}`,
      });
    } catch (err) {
      // Non-fatal: log but don't propagate – order is already confirmed.
      console.error('[WhatsApp] Failed to send tracking link:', err);
    }
  }

  return { success: true, action: 'order_confirmed', orderId: order.orderNumber || order.bookingId };
}

async function handleOrderFailed(
  order: any,
  _data: any
): Promise<WebhookResult> {
  order.status = 'failed';
  order.paymentStatus = 'failed';
  await order.save();

  console.log(`[Order] Failed: ${order._id}`);
  return { success: true, action: 'order_failed', orderId: order.orderNumber || order.bookingId };
}

async function handleOrderCancelled(
  order: any,
  _data: any
): Promise<WebhookResult> {
  order.status = 'cancelled';
  await order.save();

  console.log(`[Order] Cancelled: ${order._id}`);
  return { success: true, action: 'order_cancelled', orderId: order.orderNumber || order.bookingId };
}
