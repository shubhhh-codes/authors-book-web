# authorsbook-web: Optimization & Performance Report

**Date:** 2026-08-18
**Branch:** development
**Stack:** Next.js 16.3.1 · React 19 · MongoDB · Razorpay · Tailwind CSS v4

---

## Summary

Comprehensive optimization pass covering security hardening, dead code cleanup,
critical bug fixes, and real performance improvements.

## Commits

| Hash | Description |
|------|-------------|
| 8716ff2 | chore: upgrade Next.js 16.2.12 → 16.3.1 (security) |
| 32b596e | chore+fix+perf: deps, dead files, BUG-02, BUG-04, config |

---

## Security

### Next.js 16.2.12 → 16.3.1
Fixed 3 high-severity vulnerabilities bundled inside Next.js:
- **postcss ≤8.5.22** — XSS via unescaped </style>, path traversal via sourceMappingURL
- **sharp <0.35.0** — libvips CVEs: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591

Result: 
pm audit reports **0 vulnerabilities**.

---

## Dependency Cleanup

### Removed from dependencies
- dompurify — unused bare package; only isomorphic-dompurify is imported

### Removed from devDependencies
- jest, @types/jest, 	s-jest — dead; Vitest is the actual test runner
- 	s-node — no script invokes it
- @types/react-dom — React 19 ships its own types

### Added to devDependencies
- itest@^3.2.4 — was relied on via npx; now a proper dependency
- @vitest/coverage-v8@^3.2.4 — coverage provider

**Net: removed 252 packages, added 51. 201 fewer packages installed.**

---

## Dead Code Deleted

| File | Reason |
|------|--------|
| jest.config.js | Dead config — Vitest is the runner |
| jest.setup.js | Imports missing dep @testing-library/jest-dom, never run |
| enchmark.js | Root-level, no script references it |
| enchmark.ts | Same |
| enchmark_checkout.ts | Same |
| proxy.ts | Root-level, not imported anywhere |
| scripts/audit-variant-ids.ts | One-shot audit, no longer needed |
| scripts/test-variant-mapping.ts | One-shot dev script |
| itest.config.ts | Duplicate of itest.config.mts |

---

## Bug Fixes

### BUG-02: Cart localStorage Key Unification
**File:** pp/product/[id]/page.tsx

Product page was writing to both b_cart AND cart keys on every add-to-cart,
causing CartDrawer and cart page to go out of sync.

**Fix:**
- Reads only from b_cart
- Includes one-time migration: if old cart key exists but b_cart doesn't,
  migrates data and removes legacy key
- Removed duplicate localStorage.setItem('cart', ...) write

### BUG-04: Discount usageCount Never Incremented
**Files:** lib/schemas/Order.ts, lib/validations.ts, pp/api/checkout/route.ts, pp/api/verify-payment/route.ts

usageCount field existed on Discount schema but was never called — coupons had
unlimited usage with no tracking.

**Fix (3-part):**
1. Added discountCode: String field to Order schema
2. Added optional discountCode to CheckoutRequestSchema (Zod)
3. Persist discountCode on Order at checkout time
4. After payment verification + order.save(): atomic $inc { usageCount: 1 } on the Discount document — non-blocking, race-condition safe

---

## Performance Improvements

### next.config.ts

`diff
+ compress: true                          // gzip/brotli all responses
+ experimental.optimizePackageImports: ['three']  // tree-shake Three.js
+ images.formats: ['image/avif', 'image/webp']    // modern formats
+ images.minimumCacheTTL: 31536000        // 1 year cache for processed images
+ images.deviceSizes / imageSizes         // correct responsive sizes
+ headers(): Cache-Control on /api/products, /api/shelf-books, /api/homepage
`

### Font Consolidation (app/layout.tsx)
Removed import "@fontsource-variable/inter" — this was loading Inter twice
(once via the npm package CSS bundle, once via 
ext/font/google). The
@fontsource-variable/newsreader import is kept since Newsreader is not
loaded via 
ext/font.

**Estimated saving: ~40KB of duplicate font CSS removed from initial load.**

### ProductCard Image Optimization (components/ProductCard.tsx)
Removed unoptimized flag. With emotePatterns: ** and ormats: ['image/avif', 'image/webp']
in next.config.ts, Next.js now serves Shopify CDN images as WebP/AVIF through
its image optimization pipeline.

Added proper sizes prop:
`	sx
sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
`

**Estimated saving: ~60-77% per product image (JPEG → WebP/AVIF).**

### npm Scripts Fixed

| Script | Before | After |
|--------|--------|-------|
| 
pm test | 	sc --noEmit (type-check only) | itest run (runs actual tests) |
| 
pm run test:types | ❌ didn't exist | 	sc --noEmit |
| 
pm run test:coverage | ❌ didn't exist | itest run --coverage |
| 
pm run test:watch | ❌ didn't exist | itest |
| 
pm run db:indexes | ❌ didn't exist | 
ode scripts/create-indexes.js |

### MongoDB Indexes Script
Created scripts/create-indexes.js with correct field names from actual schemas:

`
Products: handle (unique), published+createdAt, type+published, genre, tags, vendor
Orders:   bookingId (unique), razorpayOrderId, discountCode
Discounts: code (unique), active
ShelfBooks: order, published+order
`

Run with: 
pm run db:indexes

---

## Verification

- **Build:** ✅ 
pm run build — Next.js 16.3.1, all 38 pages generated, Turbopack
- **TypeScript:** ✅ 
pm run test:types — 0 errors
- **Security:** ✅ 
pm audit — 0 vulnerabilities

---

## Manual QA Checklist (Run Before Merging to main)

- [ ] Home page loads, 3D bookshelf renders
- [ ] /shop — product grid shows WebP images (Network tab → filter by Img)
- [ ] /product/[id] — add to cart, check DevTools → Application → Local Storage → b_cart key only (no legacy cart key)
- [ ] Cart page reads correct items from b_cart
- [ ] Apply discount code during checkout → verify usageCount increments in MongoDB
- [ ] Admin login at /admin/login still works
- [ ] 
pm run seed still works

---

## Rollback

`ash
# Revert to before optimization
git revert 32b596e 8716ff2 --no-edit
git push origin development
`

---

## Next Steps (Not in Scope This Pass)

See PROGRESS.md for remaining work:
- BUG-01: Real customer auth (register/login with bcrypt)
- BUG-03: Order success page — save images in order items at checkout
- Product pages routed by handle /product/[handle] with ISR + generateMetadata
- Sitemap + robots.txt
- Razorpay webhook for reliability
- Migrate product images off Shopify CDN → Cloudinary/R2
