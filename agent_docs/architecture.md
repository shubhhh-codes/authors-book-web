# Architecture

## Request Lifecycle

```
Browser Request
    │
    ▼
middleware.ts           ← Edge runtime, runs FIRST on every /admin/* and /api/admin/*
    │  verifies ab_admin_session cookie (HMAC-SHA256)
    │  unauthenticated → redirect /admin/login  OR  401 JSON
    ▼
Next.js App Router
    │
    ├── app/layout.tsx          ← Root layout (Inter font, global CSS, SEO metadata)
    │
    ├── app/page.tsx            ← Public homepage
    ├── app/shop/               ← Public collection/shop pages
    ├── app/product/[handle]/   ← Public PDP
    ├── app/cart/               ← Cart + checkout initiation
    │
    ├── app/admin/layout.tsx    ← Admin shell: sidebar nav + header bar
    └── app/admin/*/page.tsx    ← Individual admin pages
    
    └── app/api/*/route.ts      ← API handlers (Next.js Route Handlers)
            │
            ▼
        lib/db.ts (connectDB)   ← Singleton Mongoose connection
            │
            ▼
        lib/schemas/*.ts        ← Mongoose models
            │
            ▼
        MongoDB Atlas
```

---

## Admin Auth

**File:** [`lib/adminAuth.ts`](../lib/adminAuth.ts)

Custom HMAC-SHA256 session token — no JWT library, no NextAuth for admin.

### Token Format
```
{issuedAt}.{expiresAt}.{nonce}.{hmacSignature}
```
All four segments are `.`-separated. The signature covers `issuedAt.expiresAt.nonce`.

### Key Functions

| Function | Purpose |
|---|---|
| `signAdminSessionToken()` | Issues a new token valid for 7 days |
| `verifyAdminSessionToken(token)` | Checks expiry + HMAC signature, returns `boolean` |
| `timingSafeEqualStrings(a, b)` | Constant-time string compare (prevents timing attacks) |

### Secret Key Resolution
```ts
// lib/adminAuth.ts:5
const SECRET = process.env.NEXTAUTH_SECRET || process.env.RAZORPAY_KEY_SECRET || 'antigravity-secret-key-328947';
```
⚠️ **Always set `NEXTAUTH_SECRET` in production** — the fallback is not secure.

### Login Flow
1. `POST /api/admin/auth` — password checked with `timingSafePasswordCheck`
2. On success: `signAdminSessionToken()` → set `ab_admin_session` cookie (HttpOnly, SameSite=Strict)
3. Every subsequent request: `middleware.ts` calls `verifyAdminSessionToken` (Edge-compatible Web Crypto)

### Logout
`DELETE /api/admin/auth` — clears the cookie, handled by "Sign Out" button in `app/admin/layout.tsx:20`

---

## Middleware

**File:** [`middleware.ts`](../middleware.ts)

```ts
// Runs on these routes only:
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
```

Exemptions (always allowed without auth):
- `GET /admin/login`
- `POST /api/admin/auth`

---

## Component Architecture

```
app/layout.tsx              ← global providers, fonts
components/
├── Navigation.tsx          ← top nav with cart count badge + SearchModal trigger
├── CartDrawer.tsx          ← slide-out cart (client state only, no server)
├── SearchModal.tsx         ← modal product search
├── AnnouncementBar.tsx     ← top ribbon (text from ThemeSetting API)
├── Hero.tsx                ← homepage hero section
├── CategoryGrid.tsx        ← homepage category cards
├── FeaturedProducts.tsx    ← homepage featured product grid
├── CollectionList.tsx      ← homepage collection previews
├── AboutUs.tsx             ← about section
├── AccordionSection.tsx    ← expandable FAQ
├── ProductCard.tsx         ← reusable product card (shop + featured)
└── Footer.tsx              ← site footer
```

Cart state is **client-only** (no server cart). There is no user session for customers — checkout is guest-based.

---

## Data Flow: Product Catalog

Products live **only in MongoDB**. They are seeded from Shopify CSV:

```
products_export_1.csv
    │ npm run seed (scripts/seed.js)
    ▼
MongoDB: products collection
    │ GET /api/products?type=Books&genre=Fiction
    ▼
app/shop/ or app/product/[handle]/
```

There is **no live Shopify API sync** at runtime. The Shopify store is the source of record for inventory; syncing requires re-running the seed script.
