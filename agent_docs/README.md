# agent_docs — Index

Quick-reference index for Claude Code navigating authorsbook-web.

## When to Read Each File

| File | Read when you need to… |
|---|---|
| [project_overview.md](./project_overview.md) | Understand what the app does end-to-end |
| [architecture.md](./architecture.md) | Understand request flow, admin auth, middleware |
| [tech_stack.md](./tech_stack.md) | Know which libraries exist and why |
| [building_and_testing.md](./building_and_testing.md) | Run, build, seed, or debug the app |
| [code_conventions.md](./code_conventions.md) | Write code that matches the existing style |
| [database_schema.md](./database_schema.md) | Add fields, write queries, or trace data shape |
| [api_patterns.md](./api_patterns.md) | Add a new API route or modify existing ones |
| [deployment.md](./deployment.md) | Deploy to production or configure env vars |
| [whatsapp_integration.md](./whatsapp_integration.md) | Set up, configure, and troubleshoot WhatsApp Cloud API integration |

## File Map (Fast Reference)

```
authorsbook-web/
├── app/
│   ├── layout.tsx          ← root layout, SEO metadata, Inter font
│   ├── page.tsx            ← homepage (Hero, CategoryGrid, FeaturedProducts)
│   ├── admin/              ← admin panel (layout.tsx = sidebar shell)
│   │   ├── login/          ← password login page
│   │   ├── orders/         ← order list + [id] detail
│   │   ├── products/       ← product list
│   │   ├── collections/
│   │   ├── customers/
│   │   ├── discounts/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── theme/          ← theme customizer (announcement, about text)
│   ├── api/
│   │   ├── checkout/       ← POST: create Razorpay order + DB order
│   │   ├── verify-payment/ ← POST: HMAC verify + mark order paid
│   │   ├── products/       ← GET: filtered product list
│   │   ├── orders/         ← GET/PATCH order management
│   │   ├── discounts/      ← GET: apply discount code
│   │   ├── homepage/       ← GET: homepage data
│   │   ├── contact/        ← POST: contact form
│   │   └── admin/          ← admin-only CRUD (protected by middleware)
│   ├── shop/               ← public shop/collection pages
│   ├── product/[handle]/   ← PDP
│   ├── cart/               ← cart page
│   ├── order-success/      ← post-payment confirmation
│   ├── login/ register/    ← customer auth (if used)
│   └── account/            ← customer account
├── components/             ← shared UI components
├── lib/
│   ├── db.ts               ← Mongoose singleton
│   ├── adminAuth.ts        ← HMAC session token helpers
│   ├── types.ts            ← shared TypeScript interfaces
│   └── schemas/            ← Mongoose models
│       ├── Order.ts
│       ├── Product.ts
│       ├── Discount.ts
│       └── ThemeSetting.ts
├── middleware.ts            ← Edge-compatible route guard
└── scripts/seed.js         ← CSV → MongoDB product seeder
```
