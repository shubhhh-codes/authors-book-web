# Building and Testing

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev
```

The dev server uses Next.js Turbopack by default in v16.

---

## Required Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Razorpay credentials (test keys for dev)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Used as the HMAC secret for admin session tokens
NEXTAUTH_SECRET=your-random-secret-min-32-chars

# Admin panel password (plain text, checked with timing-safe compare)
ADMIN_PASSWORD=your-admin-password
```

> ⚠️ Missing `MONGODB_URI` throws immediately at DB module load.  
> ⚠️ Missing `NEXTAUTH_SECRET` in production means the fallback insecure key is used.

---

## Database Seeding

Products are loaded from the Shopify CSV export into MongoDB:

```bash
npm run seed
# runs: node scripts/seed.js
```

**What it does:**
1. Reads `products_export_1.csv` (in project root)
2. Parses and maps Shopify CSV columns → `Product` schema fields
3. Upserts into MongoDB (keyed by `handle`)

Run this whenever you pull a new Shopify product export.

---

## Production Build

```bash
npm run build    # creates .next/ output
npm run start    # starts production server
```

Check for TypeScript errors before deploying:
```bash
npx tsc --noEmit
```

---

## Debugging Common Issues

### MongoDB connection failing in dev

`lib/db.ts` patches DNS to use Google/Cloudflare resolvers (`8.8.8.8`, `1.1.1.1`) and forces `ipv4first`. If you still see `MongoServerSelectionError`:

1. Check `MONGODB_URI` is correct in `.env.local`
2. Ensure your IP is whitelisted in MongoDB Atlas Network Access
3. Timeout is set to 5s (`serverSelectionTimeoutMS: 5000`)

### Admin login fails

The cookie `ab_admin_session` is set as HttpOnly. To debug:
1. Check `ADMIN_PASSWORD` in `.env.local` matches what you're typing
2. Check `NEXTAUTH_SECRET` is set (token signing uses it)
3. Inspect `POST /api/admin/auth` response in Network tab

### Razorpay modal not opening

- Ensure `RAZORPAY_KEY_ID` is a **test** key (`rzp_test_...`) in dev
- The Razorpay JS script must be loaded before calling `new window.Razorpay(...)`

---

## No Automated Test Suite

There are currently no Jest/Vitest/Playwright tests in the project. Manual verification flow:

1. `npm run dev` — confirm homepage loads
2. Add a product to cart, go to `/cart` — confirm cart renders
3. Test checkout with Razorpay test card: `4111 1111 1111 1111`
4. Verify order appears in `/admin/orders`
5. Test admin login/logout cycle
