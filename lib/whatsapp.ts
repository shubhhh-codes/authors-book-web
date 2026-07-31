/**
 * WhatsApp Integration with Meta Cloud API
 * Sends order confirmations and shipping updates via WhatsApp
 * 
 * Free Service Window Logic:
 * - User initiates: 24-hour free Service Window opens
 * - Order confirmation (Utility message): ~₹0.114
 * - Shipping updates within Service Window: FREE
 */

interface WhatsAppMessage {
  phone: string; // +91XXXXXXXXXX format
  orderId: string;
  customerName: string;
  total: number;
  trackingUrl?: string;
  type: 'order_confirmation' | 'shipping_update';
}

interface WhatsAppTemplateParams {
  body: {
    parameters: Array<{ type: 'text'; text: string }>;
  };
}

/**
 * Send WhatsApp message via Meta Cloud API
 * 
 * Prerequisites:
 * 1. Set up Meta Business Account
 * 2. Create WhatsApp Business Account (WABA)
 * 3. Get WABA_PHONE_ID and WHATSAPP_ACCESS_TOKEN
 * 4. Create message templates in WhatsApp Manager
 * 5. Add to .env.local:
 *    WABA_PHONE_ID=1234567890123456
 *    WHATSAPP_ACCESS_TOKEN=EAAxx...
 */
export async function sendWhatsAppNotification(message: WhatsAppMessage): Promise<boolean> {
  try {
    const { phone, orderId, customerName, total, trackingUrl, type } = message;

    const wabaPhoneId = process.env.WABA_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!wabaPhoneId || !accessToken) {
      console.warn('WhatsApp credentials not configured. Skipping notification.');
      return false;
    }

    // Normalize phone number (remove +, spaces, hyphens)
    const normalizedPhone = phone.replace(/[^\d]/g, '');
    if (!normalizedPhone.startsWith('91') || normalizedPhone.length !== 12) {
      console.error('Invalid Indian phone number format');
      return false;
    }

    const templateName = type === 'order_confirmation'
      ? 'order_confirmation_with_cta'
      : 'shipping_update';

    const parameters: WhatsAppTemplateParams = {
      body: {
        parameters: type === 'order_confirmation'
          ? [
              { type: 'text', text: customerName },
              { type: 'text', text: orderId },
              { type: 'text', text: `₹${total.toLocaleString('en-IN')}` },
              { type: 'text', text: 'authorsbook.store' },
            ]
          : [
              { type: 'text', text: customerName },
              { type: 'text', text: orderId },
              { type: 'text', text: trackingUrl || 'Check your email for tracking details' },
            ],
      },
    };

    const url = `https://graph.instagram.com/v18.0/${wabaPhoneId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          ...parameters,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      return false;
    }

    const result = await response.json();
    console.log(`WhatsApp message sent: ${result.messages?.[0]?.id || 'unknown'}`);
    return true;

  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return false;
  }
}

/**
 * Send WhatsApp text message (within Service Window - FREE)
 * Use after customer has replied to order confirmation
 */
export async function sendWhatsAppText(phone: string, message: string): Promise<boolean> {
  try {
    const wabaPhoneId = process.env.WABA_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!wabaPhoneId || !accessToken) {
      console.warn('WhatsApp credentials not configured');
      return false;
    }

    const normalizedPhone = phone.replace(/[^\d]/g, '');

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${wabaPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      console.error('WhatsApp text API error:', await response.json());
      return false;
    }

    return true;
  } catch (error) {
    console.error('WhatsApp text error:', error);
    return false;
  }
}

/**
 * WhatsApp Message Template Format (create in WhatsApp Manager):
 * 
 * Template 1: order_confirmation_with_cta
 * ───────────────────────────────────────
 * Hi {{1}},
 * 
 * Your order #{{2}} is confirmed! 📚
 * 
 * Total: {{3}}
 * 
 * Reply "TRACK" for shipping updates or
 * Visit {{4}} for more details
 * 
 * Buttons:
 * - "TRACK SHIPMENT" (sends "TRACK")
 * - "CONTACT SUPPORT" (opens chat)
 * 
 * ---
 * 
 * Template 2: shipping_update
 * ──────────────────────────
 * Hi {{1}},
 * 
 * Your order #{{2}} has shipped! 📦
 * 
 * Track here: {{3}}
 * Expected delivery: 4-5 business days
 * 
 * authorsbook.store
 */
