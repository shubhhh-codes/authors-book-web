# Deployment

## Platform

Recommended: **Vercel** (zero-config for Next.js).  
Alternative: Any Node.js host (Railway, Render, Fly.io) with `npm run build && npm run start`.

---

## Environment Variables (Production)

Set these in your hosting platform's environment config. Never commit them to git.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `RAZORPAY_KEY_ID` | ✅ | Use `rzp_live_...` key in production |
| `RAZORPAY_KEY_SECRET` | ✅ | Live secret — also used as HMAC fallback |
| `NEXTAUTH_SECRET` | ✅ | Random string (32+ chars) for admin session HMAC |
| `ADMIN_PASSWORD` | ✅ | Admin panel password |

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Production deploy
vercel --prod
```

Or connect the GitHub repo in Vercel dashboard for auto-deploy on push.

**Vercel config notes:**
- No `vercel.json` needed — Next.js is auto-detected.
- Set all env vars in **Project Settings → Environment Variables**.
- Set `RAZORPAY_KEY_ID` for **Production** environment only (separate from Preview).

---

## MongoDB Atlas Setup

1. Create a cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with `readWrite` on your DB
3. Whitelist Vercel's IP range OR set `0.0.0.0/0` (allow all) for simplicity
4. Copy the `mongodb+srv://...` connection string as `MONGODB_URI`

---

## Switching Razorpay to Live Mode

1. Get live keys from [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys
2. Set `RAZORPAY_KEY_ID=rzp_live_xxx` and `RAZORPAY_KEY_SECRET=xxx` in production env
3. Verify your Razorpay account is fully activated (KYC complete)
4. Test with a real ₹1 transaction before going live

---

## Product Sync (Shopify → MongoDB)

When you update products in Shopify:

1. Export from Shopify Admin → Products → Export → CSV for all products
2. Replace `products_export_1.csv` in project root
3. Run locally: `npm run seed`
4. This upserts into the connected MongoDB database

> ⚠️ `seed.js` connects to the `MONGODB_URI` from `.env.local`. Make sure it points to the **production** database if you want to update production.

---

## Shopify Theme (Separate from Next.js)

The `c:\Users\SHUBHHH\Downloads\authors-book\` directory also contains a Shopify OS 2.0 theme (the Taste theme). This is a **separate deployment** via the Shopify CLI:

```bash
shopify theme dev     # preview theme locally
shopify theme push    # push to live Shopify store
shopify theme pull    # pull from live store
```

The Shopify theme and the Next.js app (`authorsbook-web`) are **independent**. The Next.js app is the customer-facing storefront; the Shopify store is used for inventory management only.
