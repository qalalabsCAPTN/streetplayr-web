# StreetPlayR — Deployment Guide

## Stack
- Next.js 16 (App Router, Turbopack) on **Vercel**
- Nectar API on **Google Cloud Run** (`asia-south1`) — rewards / ledger only
- Database/Auth: **Supabase** (Postgres + RLS)
- Payments: **Easebuzz only** (INR/UPI/NetBanking)
- Inventory/Orders: Unicommerce, synced via scheduled cron jobs

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
| `EASEBUZZ_MERCHANT_KEY` | Easebuzz merchant key (server-only) |
| `EASEBUZZ_SALT` | Easebuzz salt (server-only) |
| `EASEBUZZ_ENV` | Must be `prod` in production |
| `CRON_SECRET` | Bearer token required by all `/api/cron/*` routes |

### Nectar (server-only)
| Var | Description |
|---|---|
| `NECTAR_API_URL` | Cloud Run HTTPS base (no localhost in production) |
| `NECTAR_SIGNING_SECRET` or `PLATFORM_TOKEN_STREETPLAYR` | Platform signing token |

### Integration secrets
`GOOGLE_AI_API_KEY`, `UNICOMMERCE_API_URL`, `UNICOMMERCE_USERNAME`, `UNICOMMERCE_PASSWORD`, `UNICOMMERCE_FACILITY_CODE`, `UNICOMMERCE_WEBHOOK_SECRET`

### Optional
`NEXT_PUBLIC_BRAND_ID` (default `streetplayr`), `NEXT_PUBLIC_PHONE_PREFIX` (default `+91`), `NEXT_PUBLIC_SANITY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## Deploy Steps

1. Push to `main` via GitHub Desktop / git.
2. Vercel production deploy picks up env vars from the Vercel project.
3. Confirm health: `GET /api/health` (detailed with `CRON_SECRET`).
4. Confirm Nectar: `GET {NECTAR_API_URL}/health`.

## Webhooks

`/api/webhooks/easebuzz`, `/api/webhooks/unicommerce` — signature-verified.
