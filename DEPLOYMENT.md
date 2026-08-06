# StreetPlayR — Deployment Guide

## Stack
- Next.js 16 (App Router, Turbopack) on **Google Cloud Run** (`asia-south1`)
- Build/deploy via **Google Cloud Build** (`cloudbuild.yaml`) — blue/green canary with automatic health-check promotion
- Database/Auth: **Supabase** (Postgres + RLS) — project ref `sayxtpglwjiinnrftifq`
- Payments: Stripe (primary) + Easebuzz (INR/UPI/NetBanking)
- Inventory/Orders: Unicommerce integration, synced via scheduled Cloud Scheduler jobs

## Required Environment Variables

### Core (build-blocking — see `lib/env/validate.ts`)
| Var | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, secret) |

### Production runtime-blocking
| Var | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `CRON_SECRET` | Bearer token required by all `/api/cron/*` routes |

### Integration secrets (Secret Manager, injected via `--update-secrets`)
`GOOGLE_AI_API_KEY`, `PLATFORM_TOKEN_STREETPLAYR`, `UNICOMMERCE_API_URL`, `UNICOMMERCE_USERNAME`, `UNICOMMERCE_PASSWORD`, `UNICOMMERCE_FACILITY_CODE`, `UNICOMMERCE_WEBHOOK_SECRET`

### Optional
`NEXT_PUBLIC_BRAND_ID` (default `streetplayr`), `NEXT_PUBLIC_PHONE_PREFIX` (default `+91`), `NEXT_PUBLIC_SANITY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

⚠️ **Known config issue** — `cloudbuild.yaml` sets `_SITE_URL: 'https://streetplayr.com'`. Verify this matches the domain actually pointed at Cloud Run before every release; the domain seen in live testing (`streetplayr.qalalabs.com`) currently resolves to a stray/unrelated Vercel deployment returning `DEPLOYMENT_NOT_FOUND`, not this service. See `KNOWN_LIMITATIONS.md`.

## Deploy Steps

1. Push to `main` (or trigger Cloud Build manually):
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```
2. Cloud Build:
   - Builds & pushes the Docker image (BuildKit cache) to Artifact Registry.
   - Checks if the `streetplayr-web` Cloud Run service exists.
     - **First deploy:** creates the service with 100% traffic immediately, then polls `/api/health` up to 12×10s.
     - **Subsequent deploys:** deploys a `candidate` revision with **0% traffic**, health-checks it via its private URL, and only promotes to 100% traffic once `/api/health` returns 200. Failed health checks abort the promotion — old revision keeps serving.
3. Confirm the new revision is live:
   ```bash
   gcloud run services describe streetplayr-web --region=asia-south1 --format='value(status.url,status.latestReadyRevisionName)'
   ```

## Database Migrations
28 migrations in `supabase/migrations/`, applied in filename order. Apply via Supabase CLI or MCP `apply_migration` — never hand-edit prod schema. Latest hardening migrations: `100006_allow_public_brands_read.sql` (RLS fix enabling anonymous brand resolution), `99999_final_production_hardening.sql`.

## Scheduled Jobs (Cloud Scheduler → Cloud Run)
See `terraform/modules/scheduler/main.tf`. All targets require `CRON_SECRET` bearer auth (OIDC token from `sa_scheduler_email`) and are idempotent per time window.

| Job | Schedule | Route |
|---|---|---|
| Release expired reservations | */5 min | `/api/cron/release-expired-reservations` |
| Reconciliation | */15 min | `/api/cron/reconciliation` |
| Sync products (Unicommerce) | */5 min | `/api/cron/sync-products` |
| Sync inventory (Unicommerce) | */3 min | `/api/cron/sync-inventory` |
| Sync order status (Unicommerce) | */5 min | `/api/cron/sync-order-status` |
| Sync returns (Unicommerce) | */10 min | `/api/cron/sync-returns` |

## Webhooks
`/api/webhooks/stripe`, `/api/webhooks/easebuzz`, `/api/webhooks/unicommerce` — all signature-verified.
