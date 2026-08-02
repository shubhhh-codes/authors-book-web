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

## Payment Flow

### Step 1 — Create Order

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
  "bookingId": "AB-87654321",
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
