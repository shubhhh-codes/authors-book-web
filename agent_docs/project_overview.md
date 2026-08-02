# Project Overview

## What Is authorsbook.store?

Authors Book is a direct-to-consumer Indian bookstore selling **curated books** and **hand-designed bookmarks**. It aims to make book buying personal and discovery-driven.

**Live storefront:** Next.js 16 frontend (`authorsbook-web`)  
**Inventory source:** Products imported from a Shopify CSV export (`products_export_1.csv`) and seeded into MongoDB via `scripts/seed.js`  
**Payments:** Razorpay (INR, Indian market)  

---

## User-Facing Flows

### 1. Browse & Discover
- Homepage: `app/page.tsx` — Hero → CategoryGrid → FeaturedProducts → CollectionList → AboutUs → AccordionSection (FAQ)
- Shop: `app/shop/` — filterable product grid (type, genre, vendor, tag, search)
- PDP: `app/product/[handle]/` — individual product detail page

### 2. Cart
- `components/CartDrawer.tsx` — slide-out cart overlay (client-side state)
- `app/cart/` — dedicated cart page with discount code application

### 3. Checkout & Payment
1. Customer fills shipping info, cart page calls `POST /api/checkout`
2. Server creates Razorpay order + saves `Order` doc in MongoDB with `status: 'pending'`
3. Razorpay SDK opens payment modal in browser
4. On success, browser calls `POST /api/verify-payment` with the three Razorpay IDs
5. Server verifies HMAC signature, updates order to `status: 'paid'`
6. User is redirected to `app/order-success/`

### 4. Discount Codes
- Applied at cart step via `GET /api/discounts?code=XYZ`
- `Discount` model: `percentage` or `flat` (₹), optional `minSubtotal`, tracks `usageCount`

---

## Admin Panel Flows

Admin lives at `/admin/*`. Authenticated via `ab_admin_session` cookie (HMAC-SHA256, 7-day expiry).

| Section | Path | Purpose |
|---|---|---|
| Dashboard | `/admin` | KPI cards, recent orders summary |
| Orders | `/admin/orders` | View/update all orders; `/admin/orders/[id]` for detail |
| Products | `/admin/products` | View/edit product catalog |
| Collections | `/admin/collections` | Browse product groupings |
| Customers | `/admin/customers` | Customer list derived from orders |
| Discounts | `/admin/discounts` | Create/deactivate discount codes |
| Theme | `/admin/theme` | Edit announcement bar, about section copy |
| Analytics | `/admin/analytics` | Revenue/order charts |
| Settings | `/admin/settings` | Store-level config |

---

## Key Business Rules

- **Currency:** INR only. Amounts stored in ₹ (rupees), sent to Razorpay in paise (×100).
- **Booking ID:** `AB-{last8digits of timestamp}` — human-readable order reference.
- **Order status lifecycle:** `pending` → `paid` → `shipped` → `delivered` (or `failed`)
- **Free shipping threshold:** ₹500 (shown in announcement bar, configurable via Theme admin)
- **Product types:** `Books` and `Bookmarks` (use `type` field for filtering)
