# authorsbook.store — Production Progress Tracker
## Shopify Liquid → Next.js React Migration

**Last updated:** 2026-07-31
**Stack:** Next.js 16 · React 19 · MongoDB (Mongoose) · Razorpay · Tailwind CSS v4
**Repo:** `authorsbook-web/`

---

## 🟢 COMPLETED — What's Already Built & Working

### Foundation
- [x] Next.js 16 App Router project bootstrapped
- [x] Tailwind CSS v4 configured (`postcss.config.mjs`)
- [x] TypeScript strict mode enabled
- [x] Inter font via `next/font/google` in `app/layout.tsx`
- [x] Global SEO metadata (Open Graph, Twitter Card) in `app/layout.tsx`
- [x] Path alias `@/` configured in `tsconfig.json`

### Database & Models
- [x] MongoDB singleton — `lib/db.ts` (IPv4-first DNS, 5s timeout, cached on `global.mongoose`)
- [x] `Product` schema — `lib/schemas/Product.ts` (handle, title, price, images, genre, bookmarkShape...)
- [x] `Order` schema — `lib/schemas/Order.ts` (bookingId, items, status lifecycle, Razorpay IDs, shipping)
- [x] `Discount` schema — `lib/schemas/Discount.ts` (percentage/flat, minSubtotal, usageCount)
- [x] `ThemeSetting` schema — `lib/schemas/ThemeSetting.ts` (announcement bar, about text)
- [x] Shared TypeScript interfaces — `lib/types.ts` (Product, CollectionPreview, CategoryCard, AccordionRow)
- [x] CSV seed script — `scripts/seed.js` (`npm run seed` imports `products_export_1.csv`)

### Public Storefront Pages
- [x] **Homepage** — `app/page.tsx` (ISR 60s, CategoryGrid, CollectionList x3, FeaturedProducts, AboutUs, Accordion)
- [x] **Shop** — `app/shop/page.tsx` (filter by type/genre/tag/vendor/search, pagination, active filter badges)
- [x] **Product Detail** — `app/product/[id]/page.tsx` (image gallery, qty picker, add-to-cart, CartDrawer)
- [x] **Cart** — `app/cart/page.tsx` (line items, qty/remove, order summary, shipping form, Razorpay modal)
- [x] **Order Success** — `app/order-success/[id]/page.tsx` (bookingId, items, address, delivery estimate)
- [x] **Customer Login** — `app/login/page.tsx` (UI only — localStorage, NOT real auth)
- [x] **Customer Account** — `app/account/page.tsx` (UI only — localStorage, NOT real auth)
- [x] Contact, Register pages

### Shared Components
- [x] `Navigation.tsx` — sticky nav, cart badge, search modal trigger
- [x] `CartDrawer.tsx` — slide-out cart (dispatches `cart-updated` event)
- [x] `SearchModal.tsx`, `AnnouncementBar.tsx`
- [x] `CategoryGrid.tsx`, `FeaturedProducts.tsx`, `CollectionList.tsx`
- [x] `ProductCard.tsx`, `AboutUs.tsx`, `AccordionSection.tsx`, `Footer.tsx`, `Hero.tsx`

### API Routes
- [x] `GET /api/products` — paginated + filtered (type, genre, tag, vendor, search)
- [x] `GET /api/products/[id]` — single product by MongoDB `_id`
- [x] `POST /api/checkout` — creates Razorpay order + saves Order doc (status: pending)
- [x] `POST /api/verify-payment` — HMAC-SHA256 verify + marks order paid
- [x] `GET /api/discounts` — apply discount code
- [x] `GET /api/homepage`, `POST /api/contact`

### Admin Panel (all protected by `middleware.ts`)
- [x] Admin login — password form + HMAC-SHA256 session cookie `ab_admin_session`
- [x] `lib/adminAuth.ts` — sign/verify HMAC tokens, timing-safe compare
- [x] Admin layout — Shopify-style sidebar + header (`app/admin/layout.tsx`)
- [x] Dashboard — KPI cards: total products, orders, revenue, avg order
- [x] Orders list + detail (view, mark paid, fulfill with tracking number)
- [x] Products, Collections, Customers, Discounts, Theme, Analytics, Settings pages
- [x] Admin APIs — orders CRUD, discounts CRUD, theme read/write, auth login/logout

### Security
- [x] HMAC-SHA256 admin session (pure Web Crypto)
- [x] Timing-safe password comparison
- [x] HttpOnly cookie for admin session
- [x] Razorpay payment signature verified server-side

---

## 🔴 CRITICAL BUGS — Fix Before Launch

### BUG-01: Customer Auth is Fake
**File:** `app/login/page.tsx` lines 12-17

The login form accepts any email + any password. It just saves email to localStorage and redirects. No server check whatsoever. The password field is decorative.

Fix: Build Customer schema + real login/register API endpoints with bcrypt.

---

### BUG-02: Cart Key Inconsistency
**File:** `app/product/[id]/page.tsx` lines 49-50

Product page writes to BOTH `ab_cart` AND `cart` keys. Cart page reads `cart`. CartDrawer likely reads `ab_cart`. These go out of sync.

Fix: Pick ONE key (`ab_cart`) and use it across CartDrawer, cart page, and product page.

---

### BUG-03: Order Success Shows Items Without Images
**File:** `app/order-success/[id]/page.tsx` line 88

```ts
const img = item.images?.[0]?.url; // Order items never store images
```

`Order.items[]` stores only productId, handle, title, sku, price, quantity. No images. The success page tries to render images that don't exist in the order document.

Fix: Save images in order items at checkout time, OR fetch from Product collection by handle on the success page.

---

### BUG-04: Discount usageCount Never Incremented
The `usageCount` field exists in the Discount schema but is never called when an order is placed. Coupons have unlimited usage with no tracking.

Fix — add to `POST /api/checkout` after saving the order:
```ts
if (discountCode) {
  await Discount.findOneAndUpdate({ code: discountCode }, { $inc: { usageCount: 1 } });
}
```

---

### BUG-05: Checkout Total Not Validated Server-Side
**File:** `app/api/checkout/route.ts`

Server trusts `total` sent from the browser. A user could send `{ total: 1 }` and pay Rs.1 for any order.

Fix: Fetch products from DB and recalculate total server-side before creating the Razorpay order.

---

### BUG-06: Admin Password Has Insecure Fallback
**File:** `app/api/admin/auth/route.ts` line 9

```ts
const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
```

If `ADMIN_PASSWORD` env var is missing in production, admin password becomes `admin123`. Remove the fallback — throw an error instead.

---

## 🟡 MISSING — What Needs to Be Built

### Priority 0 — Blocks launch

#### 1. Transactional Email
**Status: Not built.** Customers get zero confirmation after payment. This destroys trust.

Recommended: Resend (resend.com) — free 3,000 emails/month, clean Next.js API

Files to create:
- `lib/email.ts` — sendOrderConfirmation(order), sendNewOrderAlert(order), sendShippingConfirmation(order)
- Call sendOrderConfirmation in `POST /api/verify-payment` after marking order paid
- Call sendShippingConfirmation in `PUT /api/admin/orders/[id]` when status changes to shipped

New env var needed: `RESEND_API_KEY`

#### 2. Product URL by Handle (SEO-Critical)
**Status: Partial.** PDP uses MongoDB `_id` in URL — ugly and not indexable by Google.

Need:
- `app/product/[handle]/page.tsx` as a Server Component with ISR
- `generateMetadata({ params })` with product seoTitle, seoDescription, OG image
- JSON-LD Product schema for rich results
- Update `ProductCard.tsx` to link by `product.handle`

#### 3. sitemap.xml + robots.txt
**Status: Not built.** Required for Google to discover and index products.

Use Next.js built-in:
- `app/sitemap.ts` — generate all product URLs dynamically
- `app/robots.ts` — set crawl rules and sitemap URL

#### 4. Google Analytics 4
**Status: Not integrated.** Need GA4 for traffic, funnel analysis, and cart abandonment data.

Add GA4 script to `app/layout.tsx`. Track: view_item, add_to_cart, begin_checkout, purchase events.

#### 5. PIN Code Delivery Availability
**Status: Not built.** Standard on Indian e-commerce — check before checkout if delivery is available to customer's PIN code.

---

### Priority 1 — Before marketing

#### 6. Real Customer Authentication
**Status: UI exists but broken (BUG-01)**

What to build:
- `lib/schemas/Customer.ts` — email, passwordHash, name, phone, addresses[], createdAt
- `POST /api/auth/register` — hash password with bcryptjs, save customer
- `POST /api/auth/login` — compare hash, set session cookie
- `GET /api/auth/me` — return current customer from session
- `DELETE /api/auth/logout` — clear cookie
- Connect `app/account/page.tsx` to show real order history by customerEmail

#### 7. Customer Order Tracking Page
**Status: Not built.** After shipping, customers have no way to check status themselves.

Build `app/track/page.tsx`:
- Form: booking ID + email
- API: `GET /api/orders/track?bookingId=AB-12345678&email=...`
- Display: status, items, tracking number/link, delivery estimate

#### 8. Inventory Guard at Checkout
**Status: Not built.** Out-of-stock items can be purchased freely.

Add to `POST /api/checkout` before creating Razorpay order:
```ts
for (const item of items) {
  const product = await Product.findById(item.productId).select('inventory title');
  if (product?.inventory?.policy === 'deny' && product.inventory.quantity < item.quantity) {
    return Response.json({ error: `"${product.title}" is out of stock` }, { status: 400 });
  }
}
```

#### 9. Razorpay Webhook (Payment Reliability)
**Status: Not built.** If user closes browser after payment but before verification, order stays pending forever even though money was taken.

Build `POST /api/webhooks/razorpay`:
- Receives payment.captured event from Razorpay server-to-server
- Verify webhook signature (separate from checkout HMAC)
- Mark order paid (idempotent)
- Trigger order confirmation email

---

### Priority 2 — Polish before scale

#### 10. Mobile Checkout UX
Current: Very long single page with form + cart. No field validation. Uses alert() for errors.
Target: 3-step checkout (Cart review → Shipping address → Payment), inline error messages, toast notifications.

#### 11. Product Reviews
Build Review schema (productId, customerEmail, rating, body, approved, createdAt) + moderated display on PDP.

#### 12. Related Products on PDP
Already supported by existing API: `GET /api/products?vendor=RuskinBond&limit=4`
Just needs the UI component below the product details.

#### 13. Wishlist
Save product IDs in localStorage (guest) or Customer.wishlist[] (logged-in users).

#### 14. Product Image CDN Migration
Current: All images are Shopify CDN URLs — will expire when Shopify account closes.
Target: Migrate to Cloudinary or Cloudflare R2, update image URLs in MongoDB.

---

## 🔵 UPGRADES — Improve What Exists

### UX Upgrades

| What | Current | Target |
|---|---|---|
| Cart storage | 2 inconsistent keys (cart + ab_cart) | Single ab_cart key everywhere |
| Loading states | Plain text "Loading..." | Skeleton loader cards |
| Error feedback | alert() dialogs | Inline toast notifications |
| Product images | unoptimized flag on every Image | Next.js image optimization with domains config |
| Pagination | Button per page (breaks at 100+) | Prev/Next with page numbers |
| Search | URL param + full re-render | Debounced live search in SearchModal |

### Performance Upgrades

| What | Current | Target |
|---|---|---|
| PDP rendering | use client (CSR only, not indexable) | Server Component + ISR (revalidate 1800s) |
| MongoDB | No indexes on any field | Indexes on handle, type+published, genre, tags |
| Product images | External Shopify CDN | Cloudinary/R2 with CDN + Next.js Image |

### Security Upgrades

| What | Current | Target |
|---|---|---|
| Rate limiting | None | Upstash on /api/checkout and /api/admin/auth |
| Checkout validation | Client-calculated total | Server recalculated from DB (BUG-05) |
| Admin 2FA | Password only | TOTP or passkey |
| CSP headers | None | Add via next.config.ts headers() |

---

## PRODUCTION LAUNCH CHECKLIST

### Infrastructure
- [ ] MongoDB Atlas cluster created + Vercel IPs whitelisted
- [ ] All env vars set in Vercel Production environment
- [ ] NEXTAUTH_SECRET = random 32+ char string
- [ ] ADMIN_PASSWORD set (not empty, not admin123)
- [ ] RAZORPAY_KEY_ID / SECRET are live keys (not rzp_test_)
- [ ] RESEND_API_KEY set for transactional email
- [ ] Domain authorsbook.store connected in Vercel

### Code Fixes Required
- [ ] BUG-01: Real customer auth (register/login/session cookie)
- [ ] BUG-02: Unify cart storage to ab_cart key everywhere
- [ ] BUG-03: Fix order success images (save in items or fetch from DB)
- [ ] BUG-04: Discount usageCount incremented in checkout route
- [ ] BUG-05: Total recalculated server-side from DB prices
- [ ] BUG-06: Remove admin password fallback default

### Features Required Before Launch
- [ ] Order confirmation email to customer after payment
- [ ] New order alert email to admin after payment
- [ ] Product pages routed by handle (/product/[handle])
- [ ] Product pages server-rendered with ISR + generateMetadata
- [ ] JSON-LD Product schema on every PDP
- [ ] app/sitemap.ts generates /sitemap.xml
- [ ] app/robots.ts generates /robots.txt
- [ ] GA4 script in root layout
- [ ] Order tracking page (/track) for customers
- [ ] Inventory check in POST /api/checkout

### Testing Required
- [ ] Full checkout: test card 4111 1111 1111 1111, any future date, any CVV
- [ ] Order confirmation email received (not in spam)
- [ ] Admin: login → view order → mark shipped → tracking shows on success page
- [ ] Discount: apply code → usageCount increments in MongoDB
- [ ] Mobile 375px: full cart → checkout → success flow
- [ ] Out-of-stock product blocked at checkout
- [ ] npx tsc --noEmit — zero TypeScript errors
- [ ] npm run build — successful build

### SEO & Analytics
- [ ] Every product page has unique title + description meta
- [ ] OG image set for homepage (1200x630)
- [ ] sitemap.xml submitted to Google Search Console
- [ ] GA4 events verified in DebugView: add_to_cart, begin_checkout, purchase

### Post-Launch (within 2 weeks)
- [ ] Razorpay webhook registered at POST /api/webhooks/razorpay
- [ ] MongoDB indexes added (handle, type+published, genre, tags)
- [ ] Rate limiting on checkout + auth
- [ ] Shipping confirmation email when admin marks shipped
- [ ] Customer account shows real order history
- [ ] Plan product image CDN migration from Shopify CDN

---

## COMPLETE FILE MAP

```
authorsbook-web/
├── app/
│   ├── layout.tsx               OK  SEO metadata, Inter font, global CSS
│   ├── page.tsx                 OK  Homepage ISR 60s, 7 sections from Shopify index.json
│   ├── globals.css              OK  Tailwind v4 base styles
│   ├── shop/page.tsx            OK  Filtered shop with pagination
│   ├── product/[id]/page.tsx    WARN PDP — client-side only, needs /[handle]/ + ISR + SEO
│   ├── cart/page.tsx            WARN Missing server-side price validation (BUG-05)
│   ├── order-success/[id]/      WARN Missing product images on items (BUG-03)
│   ├── login/page.tsx           BUG  UI only — fake localStorage auth (BUG-01)
│   ├── register/page.tsx        BUG  Likely fake auth too
│   ├── account/page.tsx         BUG  localStorage only, no real order history
│   ├── contact/                 OK
│   ├── admin/
│   │   ├── layout.tsx           OK  Shopify-style sidebar + header
│   │   ├── login/page.tsx       OK  HMAC-secured password login
│   │   ├── page.tsx             OK  Dashboard KPIs
│   │   ├── orders/              OK  List + detail with fulfill action
│   │   ├── products/            OK
│   │   ├── collections/         OK
│   │   ├── customers/           OK  Derived from orders
│   │   ├── discounts/           OK  Create and list codes
│   │   ├── theme/               OK  Edit announcement + about text
│   │   ├── analytics/           OK
│   │   └── settings/            OK
│   └── api/
│       ├── products/            OK  GET list with filters + GET [id]
│       ├── checkout/            WARN Missing server-side price validation (BUG-05)
│       ├── verify-payment/      OK  HMAC verify + mark paid
│       ├── discounts/           WARN Missing usageCount increment (BUG-04)
│       ├── homepage/            OK
│       ├── contact/             OK
│       └── admin/
│           ├── auth/            OK  POST login + DELETE logout
│           ├── orders/          OK  GET list + GET/PUT [id]
│           ├── discounts/       OK  GET + POST
│           ├── products/        OK
│           └── theme/           OK
├── components/
│   ├── Navigation.tsx           OK  Sticky nav, cart count, search
│   ├── CartDrawer.tsx           OK  Slide-out cart
│   ├── SearchModal.tsx          OK
│   ├── AnnouncementBar.tsx      OK
│   ├── ProductCard.tsx          WARN Links by _id — update to handle after PDP migration
│   ├── CategoryGrid.tsx         OK
│   ├── FeaturedProducts.tsx     OK
│   ├── CollectionList.tsx       OK
│   ├── AboutUs.tsx              OK
│   ├── AccordionSection.tsx     OK
│   ├── Footer.tsx               OK
│   └── Hero.tsx                 OK
├── lib/
│   ├── db.ts                    OK  Mongoose singleton with IPv4 DNS fix
│   ├── adminAuth.ts             OK  HMAC-SHA256 session tokens
│   ├── types.ts                 OK  Shared TypeScript interfaces
│   └── schemas/
│       ├── Product.ts           OK
│       ├── Order.ts             OK
│       ├── Discount.ts          OK
│       └── ThemeSetting.ts      OK
├── middleware.ts                OK  Edge guard for /admin/* + /api/admin/*
├── scripts/seed.js              OK  CSV to MongoDB product seeder
└── products_export_1.csv        OK  Shopify export 293KB
```

---

## 4-WEEK BUILD ORDER

**Week 1 — Critical Bug Fixes + Email**
1. BUG-02: Unify cart key to ab_cart — 15 min
2. BUG-06: Remove admin password fallback — 10 min
3. BUG-04: Add discount usageCount increment in checkout — 20 min
4. BUG-05: Recalculate total server-side in checkout — 1 hr
5. BUG-03: Fix order success page images — 30 min
6. Set up Resend + order confirmation email — 2-3 hrs

**Week 2 — SEO Foundation**
1. Create app/product/[handle]/page.tsx as Server Component + ISR — 2 hrs
2. Add generateMetadata + JSON-LD Product schema to PDP — 1 hr
3. Update ProductCard to link by handle — 15 min
4. Create app/sitemap.ts and app/robots.ts — 1 hr
5. Add GA4 to root layout — 30 min

**Week 3 — Customer Auth + Tracking**
1. Customer schema + register/login/logout API — 3 hrs
2. Wire app/login and app/register to real APIs — 1 hr
3. Account page with real order history — 1 hr
4. Order tracking page (app/track/) — 2 hrs
5. Razorpay webhook — 2 hrs

**Week 4 — Performance + Launch**
1. MongoDB indexes — 30 min
2. Rate limiting with Upstash — 1 hr
3. Inventory guard in checkout — 30 min
4. Full QA: test card checkout, email, mobile, tsc check
5. npm run build + deploy to Vercel
6. Submit sitemap to Google Search Console

---

*Update this file whenever a task is completed or a new issue is found.*
