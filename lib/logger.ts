/**
 * Structured Logger for Shiprocket Integration & Observability
 */

export interface CatalogEvent {
  type:
    | 'sync_success'
    | 'sync_retry'
    | 'sync_failed'
    | 'rate_limited'
    | 'webhook_received'
    | 'order_processed'
    | 'order_failed'
    | 'variant_mapping_stored'
    | 'variant_mapping_failed';
  productId?: string | number;
  orderId?: string | number;
  variantCount?: number;
  attempt?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export function logCatalogEvent(event: CatalogEvent): void {
  const logData = {
    timestamp: new Date().toISOString(),
    service: 'shiprocket-integration',
    ...event,
  };

  if (event.type === 'sync_failed' || event.type === 'order_failed') {
    console.error(`[Shiprocket:Event]`, JSON.stringify(logData));
  } else if (event.type === 'sync_retry' || event.type === 'rate_limited') {
    console.warn(`[Shiprocket:Event]`, JSON.stringify(logData));
  } else {
    console.info(`[Shiprocket:Event]`, JSON.stringify(logData));
  }
}

export function captureWebhookError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[Shiprocket:Error]`, JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: errorMessage,
    stack,
    metadata,
  }));
}
