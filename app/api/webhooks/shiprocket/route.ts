import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/services/shiprocket';
import { processShiprocketWebhook } from '@/lib/services/shiprocket-webhook';
import { connectDB } from '@/lib/db';
import type { SRCWebhookEvent } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();

    const signature = request.headers.get('X-Shiprocket-Signature');
    if (!signature) {
      console.warn('[Webhook] Missing X-Shiprocket-Signature header');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Read raw body for signature verification BEFORE parsing
    const rawBody = await request.text();

    if (!shiprocketService.verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Webhook] Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as SRCWebhookEvent;
    const result = await processShiprocketWebhook(payload);

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/** Health check – Shiprocket dashboard sometimes pings GET to verify the URL */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Shiprocket webhook endpoint active. Use POST to deliver events.',
  });
}
