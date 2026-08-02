# Tech Stack

## Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.12 | App Router, RSC, Route Handlers, middleware |
| `react` / `react-dom` | 19.2.4 | UI rendering |
| `mongoose` | ^9.9.0 | MongoDB ODM (models, schemas, connection pooling) |
| `mongodb` | ^7.5.0 | Direct MongoDB driver (used by Mongoose internally) |
| `razorpay` | ^2.9.8 | Payment gateway SDK (server-side order creation) |
| `axios` | ^1.19.0 | HTTP client (used in admin pages for API calls) |
| `csv-parser` | ^3.2.1 | CSV parsing in `scripts/seed.js` |

## Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | ^4 | Utility CSS (v4 — uses `@tailwindcss/postcss`, no `tailwind.config.js`) |
| `typescript` | ^5 | Type checking |
| `@types/react` | ^19 | React types |
| `@types/node` | ^20 | Node.js types |

---

## Important Framework Notes

### Next.js 16 App Router
- All routes use the **App Router** (`app/` directory), not Pages Router.
- API routes are **Route Handlers** (`route.ts` files), not `pages/api/`.
- Use `Response.json(...)` or `NextResponse.json(...)` — not `res.json()`.
- Server Components by default; use `'use client'` only when needed.

### Tailwind CSS v4
- **No `tailwind.config.js`** — configuration is in `postcss.config.mjs`.
- Uses `@import "tailwindcss"` in CSS, not `@tailwind base/components/utilities`.
- New v4 features: `bg-[#hex]` direct values, `text-xs` etc. work as normal.

### Mongoose Singleton Pattern
All API routes call `connectDB()` from `lib/db.ts` before any DB operation:
```ts
import { connectDB } from '@/lib/db';

export async function GET() {
  await connectDB();
  // ... query
}
```
The connection is cached on `global.mongoose` to survive Next.js hot-reload in dev.

### Razorpay Integration
- **Server:** `app/api/checkout/route.ts` — creates order using `razorpay.orders.create()`
- **Client:** Razorpay JS modal opened via `window.Razorpay` (loaded via script tag in cart page)
- **Verification:** `app/api/verify-payment/route.ts` — HMAC SHA256 with `crypto` module

### Path Aliases
`tsconfig.json` configures `@/` as the project root:
```json
"paths": { "@/*": ["./*"] }
```
Use `@/lib/db`, `@/components/Navigation`, etc.

---

## What's NOT in This Codebase

- ❌ NextAuth / Auth.js (customer auth) — login/register pages exist but auth state is minimal
- ❌ Redux / Zustand — cart is local React state in `CartDrawer.tsx`
- ❌ SWR / React Query — admin pages use `axios` + `useEffect` directly
- ❌ Prisma — MongoDB only, via Mongoose
- ❌ Email service — no transactional email wired up yet
- ❌ Live Shopify API — products come from seeded MongoDB, not live Shopify queries
