# WhatsApp Integration

## Overview
authorsbook-web sends order confirmations and shipping updates via WhatsApp using Meta Cloud API. Uses Service Window free window (24h after customer initiates) for cost optimization.

## Setup

### Prerequisites
- Meta Business Account (business.facebook.com)
- WhatsApp Business Account (WABA)
- WhatsApp Manager access (templates creation)

### Step-by-Step Setup

1. Create WhatsApp Business Account
   - Go to business.facebook.com → Accounts
   - Create new Business Account or use existing
   - Verify business information

2. Get WABA Phone ID
   - WhatsApp Manager → Phone Numbers
   - Copy the phone number ID (16-digit number)
   - Set as WABA_PHONE_ID in env

3. Create Access Token
   - Meta App (developers.facebook.com)
   - App Settings → API Keys
   - Create API token with whatsapp_business_messaging scope
   - Set as WHATSAPP_ACCESS_TOKEN in env

4. Create Message Templates
   - WhatsApp Manager → Message Templates
   - Create template "order_confirmation_with_cta":
     ```
     Hi {{1}},
     Your order #{{2}} is confirmed! 📚
     Total: {{3}}
     Reply "TRACK" or visit {{4}}
     ```
   - Create template "shipping_update":
     ```
     Hi {{1}},
     Your order #{{2}} has shipped! 📦
     Track: {{3}}
     Expected delivery: 4-5 business days
     ```

5. Add Environment Variables
   ```
   WABA_PHONE_ID=<16-digit phone ID>
   WHATSAPP_ACCESS_TOKEN=<Meta API token>
   WHATSAPP_BUSINESS_PHONE=+919876543210
   ```

## Functions

### sendWhatsAppNotification(message)
Sends templated WhatsApp message (order confirmation or shipping update).

**Parameters:**
```typescript
{
  phone: string;              // +91XXXXXXXXXX format
  orderId: string;            // Order ID (e.g., "AB-45678901-a1b2c3d4")
  customerName: string;
  total: number;              // Amount in ₹
  trackingUrl?: string;       // For shipping updates
  type: 'order_confirmation' | 'shipping_update';
}
```

**Returns:** `boolean` (success/failure)

**Called from:** app/api/verify-payment/route.ts (on payment success)

**Template Parameters:**
- order_confirmation: [customerName, orderId, total, businessName]
- shipping_update: [customerName, orderId, trackingUrl]

### sendWhatsAppText(phone, message)
Sends free text message within 24-hour Service Window.

**Usage:** After customer replies to order confirmation

**Parameters:**
```typescript
phone: string;      // +91XXXXXXXXXX
message: string;    // Message body
```

## Service Window & Billing

**Cost Model:**
- Order confirmation (template): ~₹0.114 per message (Utility category)
- Messages within 24h Service Window: FREE
- Messages outside Service Window: ~₹0.60 per message (Marketing category)

**Strategy:**
1. Send order_confirmation template → Opens 24-hour free Service Window
2. Customer can reply at no cost
3. Use sendWhatsAppText() for shipping updates within 24h (free)
4. Outside 24h: would need different template (marketing costs apply)

## Error Handling

- If credentials not configured: logs warning, doesn't crash
- If API request fails: logs error, continues processing (graceful degradation)
- No retry logic (caller should implement if needed)

## Debugging

Check logs for:
- "WhatsApp credentials not configured" → Missing env vars
- "Invalid Indian phone number format" → Phone not normalized to 12-digit format
- "WhatsApp API error" → API response error details
- "WhatsApp message sent: <messageId>" → Success

## Testing

Use test credentials from Meta:
- Create test template in WhatsApp Manager
- Use test phone numbers (provided by Meta)
- Full flow: add to cart → checkout → verify-payment → WhatsApp notification sent
