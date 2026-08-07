# Code Conventions

## TypeScript

- **Strict mode** is on (`tsconfig.json`).
- Shared interfaces live in [`lib/types.ts`](../lib/types.ts) — add new ones there.
- Mongoose documents are typed via `any` in many admin pages; prefer using the interfaces from `lib/types.ts` when possible.
- Path alias: always use `@/` over relative `../../`:
  ```ts
  // ✅ correct
  import { connectDB } from '@/lib/db';
  // ❌ avoid
  import { connectDB } from '../../lib/db';
  ```

---

## API Route Handlers

**File convention:** `app/api/<resource>/route.ts`

Pattern:

```ts
import { connectDB } from '@/lib/db';
import ModelName from '@/lib/schemas/ModelName';

export async function GET(request: Request) {
  try {
    await connectDB();
    // ... query
    return Response.json({ data });
  } catch (error: any) {
    console.error('Description error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Rules:
- Always call `connectDB()` first.
- Always wrap in `try/catch` and return `{ error: error.message }` with `status: 500`.
- Use `Response.json(...)` for public routes; `NextResponse.json(...)` for admin routes (either works but be consistent per file).
- Admin routes under `app/api/admin/` are already protected by middleware — no extra auth check needed inside the handler.

---

## React Components

- **Server Components by default.** Only add `'use client'` when you use hooks (`useState`, `useEffect`, `usePathname`, etc.) or browser APIs.
- Components in `components/` are reusable UI. Page-specific logic stays in `app/*/page.tsx`.
- Styling: **Tailwind CSS v4 utility classes inline**. No separate CSS files for components.
- No CSS modules, no styled-components.

Example client component pattern (see `components/CartDrawer.tsx`):
```tsx
'use client';
import { useState } from 'react';

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  // ...
}
```

---

## Mongoose Models

- Model files: `lib/schemas/<ModelName>.ts`
- Always use the `mongoose.models.X || mongoose.model('X', schema)` guard to prevent re-registration in hot-reload:
  ```ts
  export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
  ```
- Import in route handlers:
  ```ts
  import Order from '@/lib/schemas/Order';
  ```

---

## Validation & Error Handling

**File:** [`lib/validations.ts`](../lib/validations.ts)

All API routes use Zod schemas from `lib/validations.ts` for strict input validation and unified response helpers.

**Main Schemas:**
- `CheckoutRequestSchema`: `items` (array of `CheckoutItemSchema`), `subtotal`, `shippingCost`, `total`, `customerEmail`, `customerName`, `customerPhone`, `shippingAddress`
- `CheckoutItemSchema`: `productId`, `handle`, `title`, `sku` (optional), `price` (positive), `quantity` (positive integer)
- `ShippingAddressSchema`: `street` (min 5 chars), `city` (min 2 chars), `state` (min 2 chars), `zip` (regex: `/^\d{6}$/` for 6-digit Indian PIN)
- `VerifyPaymentSchema`: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `orderId`

**Utility Functions:**
- `parseRequestBody(request, schema)`: Parses and validates JSON body, throws ZodError formatted message if invalid
- `errorResponse(message, status)`: Returns `Response.json({ error: message }, { status })`
- `successResponse(data, status)`: Returns `Response.json(data, { status })`

**Standard API Route Pattern:**
```ts
import { parseRequestBody, errorResponse, successResponse } from '@/lib/validations';
import { SomeSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const payload = await parseRequestBody(request, SomeSchema);
    // ... logic
    return successResponse({ success: true, data });
  } catch (error: any) {
    console.error('Route error:', error);
    return errorResponse(error.message, 500);
  }
}
```

**Validation Rules Enforced:**
- **Price:** must be positive number (`> 0`)
- **Quantity:** must be positive integer (`≥ 1`)
- **ZIP code:** exactly 6 digits (Indian postal format `/^\d{6}$/`)
- **Email:** standard email format
- **Phone:** 10-digit Indian number (`/^\d{10}$/`)

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `ProductCard`, `CartDrawer` |
| API route files | always `route.ts` | `app/api/checkout/route.ts` |
| Mongoose schema files | PascalCase | `Order.ts`, `ThemeSetting.ts` |
| TypeScript interfaces | PascalCase | `Product`, `CollectionPreview` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `RAZORPAY_KEY_ID` |
| Booking IDs | `AB-{8digits}` | `AB-45678901` |
| Admin cookie | `ab_admin_session` | (do not rename — middleware depends on it) |

---

## Admin Panel Style

The admin layout (`app/admin/layout.tsx`) uses a Shopify Polaris-inspired design:
- Background: `#f1f2f4`, sidebar: `#ebebeb`, header: `#1a1a1a`
- Active nav item: `bg-white shadow-xs border border-gray-200`
- Accent color: `emerald-500` (brand green)

When adding new admin pages, follow this structural pattern:
```tsx
// app/admin/new-section/page.tsx
export default function NewSectionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Section Title</h1>
      {/* content */}
    </div>
  );
}
```
The `<main>` wrapper with padding is provided by `app/admin/layout.tsx:240`.
