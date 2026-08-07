# API Patterns

## Endpoint Map

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/products` | Public | Paginated, filtered product list |
| `GET` | `/api/products/[id]` | Public | Single product by ID |
| `POST` | `/api/checkout` | Public | Create Razorpay order + DB order |
| `POST` | `/api/verify-payment` | Public | Verify payment HMAC + update order |
| `GET` | `/api/discounts` | Public | Apply discount code |
| `GET` | `/api/homepage` | Public | Homepage data (featured products, etc.) |
| `POST` | `/api/contact` | Public | Contact form submission |
| `GET/POST` | `/api/admin/auth` | Mixed | Login (POST) / Logout (DELETE) |
| `GET/POST` | `/api/admin/orders` | Admin | Order management |
| `PATCH` | `/api/admin/orders/[id]` | Admin | Update order status |
| `GET/POST` | `/api/admin/discounts` | Admin | Create/list discount codes |
| `GET/PATCH` | `/api/admin/theme` | Admin | Read/update theme settings |
| `GET` | `/api/admin/customers` | Admin | List unique customers from orders |
| `GET` | `/api/admin/analytics` | Admin | Revenue/order metrics |

---

## Public API Patterns

### Products — Filtering

**File:** [`app/api/products/route.ts`](../app/api/products/route.ts)

Query params: `page`, `limit`, `type`, `genre`, `tag`, `vendor`, `search`

```
GET /api/products?type=Books&genre=Fiction&page=1&limit=12
GET /api/products?search=paulo+coelho
GET /api/products?tag=bestseller
```

Response shape:
```json
{
  "products": [...],
  "pagination": { "total": 84, "page": 1, "limit": 12, "pages": 7 }
}
```

Regex matching is used for `genre` and `tag` (hyphens converted to `[-\s]?` patterns).

---

## Rate Limiting

**File:** [`lib/rateLimit.ts`](../lib/rateLimit.ts)

- `checkRateLimit(identifier, limit, windowMs)`: Checks if request identifier (IP) exceeds rate limit. Returns `{ allowed: boolean, remaining: number }`.
- `getClientIp(request)`: Helper function to extract client IP checking `x-forwarded-for`, `x-real-ip`, and localhost fallbacks.

**Current applied limits:**
- `POST /api/checkout`: 5 requests per IP per minute
- `POST /api/verify-payment`: 10 requests per IP per minute

**Storage:** In-memory `Map` store (resets on server restart). Requires Redis for production distributed rate limiting.

**Timing:** Rate limiting check happens **BEFORE** database connection (step 0 in checkout flow).

**Example Usage in API Route:**
```ts
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const { allowed } = checkRateLimit(clientIp, 5, 60 * 1000);
  if (!allowed) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Proceed with route logic
}
```

---

## Payment Flow

### Step 0 — Rate Limiting
- Check request rate limit using `checkRateLimit(clientIp, 5, 60*1000)`
- Return 429 if exceeded
- This happens before any database operations

### Complete Checkout Flow (Steps 1–8)
1. **Validate request** with `CheckoutRequestSchema` (Zod)
2. **Verify products exist** in DB (by `_id`)
3. **Verify prices haven't changed** (tolerance: ±₹1)
4. **Check inventory** before order creation
5. **Generate unique booking ID**: `AB-{8digits}-{4hex}` (`Date.now().toString().slice(-8)` + `crypto.randomBytes(4).toString('hex')`)
6. **Create order in MongoDB** with status: `'pending'` BEFORE Razorpay
7. **Create Razorpay order** with `razorpay.orders.create()`
8. **Update order** with `razorpayOrderId` and save

- **Error handling:** If checkout fails after order creation, delete the order via `findByIdAndDelete()` to prevent orphans
- **Error messages:** Sanitize sensitive errors before returning to client

### Step 1 — Create Order API Call

**File:** [`app/api/checkout/route.ts`](../app/api/checkout/route.ts)  
**Method:** `POST /api/checkout`

Request body:
```json
{
  "items": [{ "productId": "...", "handle": "...", "title": "...", "price": 499, "quantity": 1 }],
  "subtotal": 499,
  "shippingCost": 0,
  "total": 499,
  "customerName": "Priya Sharma",
  "customerEmail": "priya@example.com",
  "customerPhone": "9876543210",
  "shippingAddress": { "street": "...", "city": "Mumbai", "state": "Maharashtra", "zip": "400001" }
}
```

Response:
```json
{
  "orderId": "<mongo _id>",
  "bookingId": "AB-87654321-a1b2c3d4",
  "razorpayOrderId": "order_xxxx",
  "razorpayKey": "rzp_test_xxx",
  "amount": 49900
}
```

Amount is in **paise** (₹499 × 100 = `49900`).

### Step 2 — Open Razorpay Modal (Client)

```js
const rzp = new window.Razorpay({
  key: data.razorpayKey,
  amount: data.amount,
  order_id: data.razorpayOrderId,
  handler: async (response) => {
    // called by Razorpay on success
    await verifyPayment(response, data.orderId);
  }
});
rzp.open();
```

### Step 3 — Verify Payment

**File:** [`app/api/verify-payment/route.ts`](../app/api/verify-payment/route.ts)  
**Method:** `POST /api/verify-payment`

Request body:
```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "...",
  "orderId": "<mongo _id>"
}
```

Verification: HMAC-SHA256 of `{razorpayOrderId}|{razorpayPaymentId}` using `RAZORPAY_KEY_SECRET`.

---

## Admin API Patterns

All routes under `/api/admin/*` are protected by `middleware.ts`. No auth check needed inside handlers.

### Discounts CRUD

**File:** [`app/api/admin/discounts/route.ts`](../app/api/admin/discounts/route.ts)

```
GET  /api/admin/discounts       → array of all discount docs
POST /api/admin/discounts       → create new discount
```

POST body:
```json
{
  "code": "SAVE20",
  "discountType": "percentage",
  "value": 20,
  "minSubtotal": 300
}
```

---

## Adding a New API Route

1. Create `app/api/<resource>/route.ts`
2. Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
3. Always start with `await connectDB()`
4. Use the try/catch pattern from `code_conventions.md`
5. If it's an admin route, place it under `app/api/admin/<resource>/route.ts` — middleware handles auth automatically

```ts
// app/api/admin/shipping/route.ts
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const { orderId, trackingUrl } = await request.json();
    const order = await Order.findByIdAndUpdate(orderId, { trackingUrl }, { new: true });
    return Response.json({ success: true, order });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```
