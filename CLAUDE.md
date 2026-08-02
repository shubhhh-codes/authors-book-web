# Authors Book — Claude Code Guide

E-commerce storefront for books & bookmarks. Next.js 16 frontend + custom admin, MongoDB backend, Razorpay payments.

## Quick Navigation

| Need to… | Read |
|---|---|
| Understand the full system | `agent_docs/project_overview.md` |
| Work on the admin panel | `agent_docs/architecture.md` |
| Add/modify an API route | `agent_docs/api_patterns.md` |
| Change DB schemas | `agent_docs/database_schema.md` |
| Understand auth & security | `agent_docs/architecture.md#admin-auth` |
| Work on payments | `agent_docs/api_patterns.md#payment-flow` |
| Build/run the app | `agent_docs/building_and_testing.md` |
| Follow code style | `agent_docs/code_conventions.md` |
| Deploy | `agent_docs/deployment.md` |

## Critical Files (High-Regression Risk)

- `middleware.ts` — guards all `/admin` and `/api/admin` routes
- `lib/adminAuth.ts` — HMAC-SHA256 session token logic
- `lib/db.ts` — singleton Mongoose connection
- `app/api/checkout/route.ts` — Razorpay order creation
- `app/api/verify-payment/route.ts` — HMAC signature verification

## Dev Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run seed     # seed products from CSV → MongoDB
```

## Env Vars Required

```
MONGODB_URI
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXTAUTH_SECRET
ADMIN_PASSWORD
```

## Architecture in One Line

`Next.js App Router` → `API Routes` → `Mongoose (MongoDB)` + `Razorpay SDK`

Admin at `/admin/*` protected by HMAC session cookie `ab_admin_session` verified in `middleware.ts`.

> See `agent_docs/` for deep-dives on each subsystem.
