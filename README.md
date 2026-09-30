# NovaNet Portal

A production-ready customer, technician and admin platform for a managed internet service provider in Nigeria — estate residents, businesses, pay-as-you-go hotspot users, field technicians and administrators all in one console.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL, and Auth.js (NextAuth v5). Integrates Paystack and Flutterwave for payments, a real MikroTik RouterOS REST API client, and a Starlink telemetry service that runs in simulated mode until real API credentials are supplied.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Payments](#payments)
- [MikroTik integration](#mikrotik-integration)
- [Starlink integration](#starlink-integration)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Security notes](#security-notes)
- [What's real vs. placeholder](#whats-real-vs-placeholder)
- [Demo accounts](#demo-accounts)

## Features

- **Five roles**: Admin, Technician, Resident, Business, Hotspot user — each with its own dashboard and nav
- **Subscriptions**: residential/business plans priced per access point + device limit, upgrade/switch/cancel/auto-renew
- **Hotspot vouchers**: admin batch generation, self-service purchase, QR-code redemption, no-login public redeem page
- **Payments**: Paystack and Flutterwave, both wired to real REST endpoints with signature-verified webhooks *and* a synchronous callback-page fallback (see [Payments](#payments))
- **Invoices**: auto-generated on successful subscription payment, printable
- **Support ticketing**: categories, priorities, technician assignment, threaded replies
- **Notifications**: in-app bell + full notifications page
- **Network monitoring**: live MikroTik router health + active hotspot sessions with disconnect; Starlink dish telemetry
- **Analytics**: revenue trend, plan distribution, ticket status (Recharts)
- **RBAC everywhere**: enforced at middleware, page, and API layers independently (see [Security notes](#security-notes))

## Tech stack

Next.js 15.5.10 · React 19.2.4 · TypeScript · Tailwind CSS 3 · Prisma 6 · PostgreSQL · Auth.js (NextAuth) v5 · Radix UI primitives · Recharts · Zod · React Hook Form

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# fill in DATABASE_URL at minimum to get started locally

# 3. Start a local Postgres (or point DATABASE_URL at one you already have)
docker compose up -d db

# 4. Create the schema and seed demo data
npx prisma migrate dev --name init
npm run db:seed

# 5. Run the dev server
npm run dev
```

Open http://localhost:3000. See [Demo accounts](#demo-accounts) to log in immediately.

> **Node 20+** is required. This project was authored in a sandboxed environment without package-registry access, so dependencies have never been `npm install`-ed or `next build`-ed against a live registry — run `npm install` and skim the build output on first run, and open an issue-style note to yourself if any transitive version needs bumping.

## Environment variables

See `.env.example` for the full list with descriptions. At minimum for local dev you need `DATABASE_URL` and `AUTH_SECRET` (generate with `openssl rand -base64 32`). Payment, MikroTik and Starlink keys can stay blank — those features degrade gracefully (checkout will error clearly; network page shows "not configured"; Starlink shows simulated data).

## Database

Schema lives in `prisma/schema.prisma`. Key models: `User` (role-based), `Plan`, `Subscription`, `Payment`, `Invoice`, `HotspotVoucher` + `VoucherBatch`, `SupportTicket` + `TicketMessage`, `Notification`, `NetworkDevice`, `TechnicianJob`, `Estate`, `AuditLog`.

```bash
npx prisma migrate dev --name <description>   # create + apply a migration locally
npx prisma migrate deploy                      # apply migrations in production
npx prisma studio                               # browse data visually
npm run db:seed                                 # re-seed demo data (destructive — wipes existing rows)
```

## Payments

Both providers are wired for real against their documented REST APIs — no SDK wrapper, just typed `fetch` calls in `src/lib/services/paystack.ts` and `flutterwave.ts`:

- **Paystack**: amounts are converted to kobo automatically. Webhook signature is verified as an HMAC-SHA512 of the *raw* request body against `x-paystack-signature`.
- **Flutterwave**: amounts are sent in the major currency unit (no conversion). Webhook is verified by comparing the `verif-hash` header against `FLUTTERWAVE_SECRET_HASH` (the string you set once in Flutterwave Dashboard → Settings → Webhooks).

Fulfillment (activating a subscription, minting a voucher, generating an invoice) happens in `src/lib/services/payment-fulfillment.ts`, which is **idempotent** — it's called from both the webhook route *and* the synchronous browser callback page (`/dashboard/billing/callback`), and whichever fires first wins; the second call is a no-op. This means payments still get fulfilled even if a webhook is delayed or never arrives (e.g. local dev with no public URL for Paystack/Flutterwave to reach).

To receive real webhooks locally, tunnel with ngrok/Cloudflare Tunnel and point each provider's dashboard at `https://<your-tunnel>/api/payments/paystack/webhook` and `.../flutterwave/webhook`.

## MikroTik integration

`src/lib/services/mikrotik.ts` talks to a real router over the **RouterOS REST API** (RouterOS ≥ 7.1beta4), using HTTP Basic Auth:

1. On the router: `/ip service enable www-ssl` (or `www` for plain HTTP on a trusted LAN only)
2. Create a dedicated API user (not your main admin login) with the minimum required policy
3. Set `MIKROTIK_HOST`, `MIKROTIK_USERNAME`, `MIKROTIK_PASSWORD` in `.env`
4. The `/dashboard/network` page will show live router health and active hotspot sessions; voucher redemption will attempt to provision a matching RouterOS hotspot user automatically

If unreachable or unconfigured, the network page shows a clear "not configured" / "unreachable" state instead of crashing — this was written for a real router but has not been tested against physical hardware in this environment.

## Starlink integration

Starlink's Enterprise/Telemetry API requires a Reseller/Business account relationship that can't be provisioned here. `src/lib/services/starlink.ts` implements the documented shape of that integration (OAuth2 client-credentials token exchange, then authenticated telemetry calls) but **returns clearly-labeled simulated data** until `STARLINK_CLIENT_ID` / `STARLINK_CLIENT_SECRET` / `STARLINK_ACCOUNT_NUMBER` are set. The network page shows a "Simulated data" vs "Live data" badge so this is never ambiguous to an admin.

## Deployment

### Docker

```bash
docker compose up -d --build
```

Runs Postgres + the app together. The `Dockerfile` is a multi-stage build using Next.js `output: "standalone"` for a minimal runtime image.

### Vercel (or similar platform)

Works out of the box — `output: "standalone"` is ignored by Vercel's own build pipeline, no changes needed. You will need to:

1. Point `DATABASE_URL` at a pooled Postgres connection (Vercel Postgres, Neon, Supabase) — serverless functions exhaust connections fast against a non-pooled URL
2. Run `npx prisma migrate deploy` against production from your machine once (Vercel doesn't run this for you)
3. Set every variable from `.env.example` in the project's environment settings
4. Point Paystack/Flutterwave webhook URLs at your deployed domain

### Anywhere else running Node 20+

```bash
npm run build
npm run start
```

## Project structure

```
prisma/schema.prisma       Data model
prisma/seed.ts              Demo data (Santos Estate, real plan tiers, 5 demo accounts)
src/auth.ts                 Auth.js v5 config (Credentials provider, JWT sessions)
src/middleware.ts           First-pass route protection (see Security notes)
src/lib/rbac.ts             Page- and API-level role guards
src/lib/services/           Paystack, Flutterwave, MikroTik, Starlink, vouchers, invoices, notifications
src/app/(auth)/             Login / register
src/app/dashboard/          Role-aware product (one layout, branching pages)
src/app/api/                Route handlers — REST-ish, one concern per route
src/components/ui/          Hand-built design system (Radix primitives + Tailwind, shadcn-style)
src/components/marketing/   Public landing page sections
```

## Security notes

- **Defense in depth on auth**: enforced independently at three layers — `middleware.ts` (edge, coarse), every dashboard page via `requireRole()`, and every API route via `apiRequireRole()`. This is deliberate: Next.js middleware-only protection has a real CVE history (header-spoofing bypasses), so nothing here relies on middleware alone.
- **Passwords**: hashed with bcrypt (cost factor 10), never logged or returned from any API response.
- **Webhooks**: both providers' webhook routes verify a cryptographic signature before trusting the payload; the callback page (which reads untrusted query params from a redirect) independently re-verifies with the provider's server-side verify endpoint before fulfilling anything.
- **Pinned versions**: `next` is pinned to `15.5.10` and `react`/`react-dom` to `19.2.4` deliberately — earlier 15.x lines had a critical (CVSS 10) RSC vulnerability patched across minor lines in late 2025/early 2026. Keep this pin current; don't loosen it to a caret range without checking the latest security advisory.

## What's real vs. placeholder

| Area | Status |
|---|---|
| Auth, RBAC, subscriptions, tickets, notifications, invoices | Fully implemented against Prisma/Postgres |
| Paystack / Flutterwave | Real REST integration, needs your live/test API keys |
| MikroTik | Real REST client, needs a reachable RouterOS ≥7 router |
| Starlink | Real OAuth2 + REST shape, **simulated data** until you have Enterprise API access |
| Everything | Written but never run against live infra in this environment (no network access during generation) — run `npm install`, migrate, and smoke-test before trusting it in production |

## Demo accounts

Seeded by `npm run db:seed`. Password for all: `NovaNet@2026` — **change or delete these before deploying anywhere public.**

| Role | Email |
|---|---|
| Admin | admin@novanet.ng |
| Technician | tech@novanet.ng |
| Resident | resident@novanet.ng |
| Business | business@novanet.ng |
| Hotspot user | hotspot@novanet.ng |

---

NovaNet Communications Ltd. · Abuja, FCT, Nigeria · salihubelel2023@gmail.com
