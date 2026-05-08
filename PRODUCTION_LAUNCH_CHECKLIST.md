# StreetPlayR — Production Launch Requirements Checklist

> **Audience**: Production architect, infrastructure engineer, commerce systems lead, reliability engineer.
>
> Every item includes: purpose, priority, blocking status, complexity, risk if skipped, and gate phase.
>
> **Priority key**: P0=critical path, P1=high, P2=moderate, P3=enhancement.
> **Gate key**: LOCAL=needed for local testing, SOFT=needed before soft launch, COMMERCE=needed before live orders.

---

## 1. Infrastructure Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 1.1 | Supabase production project provisioned | Host DB, auth, realtime, storage. Cannot run without a project. | P0 | Yes | Low | Zero — the app has no data layer | SOFT |
| 1.2 | Supabase project configured with proper compute size | Production traffic requires at least `Small` (2 CPU, 4 GB RAM). `Free` tier rate-limits and pauses. | P1 | Yes (traffic) | Low | DB throttling, connection pool exhaustion under load, project auto-pause | SOFT |
| 1.3 | Supabase point-in-time recovery enabled | Roll back from data corruption or bad migration within 7-day window. | P2 | No | Low | Permanent data loss on incident. RPO limited to last backup. | COMMERCE |
| 1.4 | Supabase connection pooler (PgBouncer) configured | Manage concurrent connections from serverless functions. Without it, direct connections exhaust Supabase limit (15–60). | P0 | Yes | Low | Connection pool exhaustion → 5xx on every server action / API route | SOFT |
| 1.5 | Supabase project region selected closest to users | Minimize auth + query latency. | P1 | No | Low | 100–300 ms added latency on every request | COMMERCE |
| 1.6 | Supabase custom domain configured | Avoid CORS issues with `*.supabase.co` domain; required for production auth redirects. | P1 | Yes (Stripe activation) | Medium | Auth redirect mismatches, CORS failures on some browsers | SOFT |
| 1.7 | Vercel project provisioned (Pro or Enterprise) | Host the Next.js application. Hobby tier has concurrency and build limits. | P0 | Yes | Low | No deployment target | SOFT |
| 1.8 | Vercel team + project member access set | Operational security — no shared logins. | P2 | No | Low | Account compromise, audit trail loss | SOFT |
| 1.9 | Vercel deployment protection configured | Require password or team login for preview deployments. | P2 | No | Low | Accidental public exposure of preview builds | SOFT |
| 1.10 | CDN / edge caching strategy defined (Vercel Edge Network) | Serve static assets, product images, and cacheable pages from edge. | P2 | No | Medium | Higher origin load, slower TTFB for global users | COMMERCE |

---

## 2. Supabase Setup Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 2.1 | Run migrations 00001–00005 against production DB | Schema, RLS, triggers, functions, enums, indexes. Foundation for everything. | P0 | Yes | Low | No database schema → zero functionality | SOFT |
| 2.2 | Verify RLS policies grant minimum necessary access | Ensure authenticated users can only access own data; ops users only ops data; no leakage. | P0 | Yes | Medium | Data breach (user A sees user B's orders, wallet, personal info) | SOFT |
| 2.3 | Seed test product data (variants, inventory, pricing) | Without products, storefront renders empty. Need 5–10 drops for soft launch. | P1 | Yes (testing) | Low | No content to validate UX flows | LOCAL |
| 2.4 | Create Supabase service role key (strong, rotated) | Admin client authentication. Compromise = full DB access. | P0 | Yes | Low | Admin client unusable → all server actions + orchestration fail | SOFT |
| 2.5 | Create Supabase anon key (scoped to project) | Client-side Supabase access. Compromise = limited RLS-gated exposure. | P0 | Yes | Low | Browser client unusable → login, realtime, product queries fail | SOFT |
| 2.6 | Validate `idempotency_keys` table RLS (service-role only) | Prevent users from reading/writing idempotency records directly. | P1 | Yes (payments) | Low | Idempotency bypass → duplicate payment processing | COMMERCE |
| 2.7 | Validate `operational_events` table RLS (service-role only) | Prevent users from injecting fake audit events. | P1 | Yes | Low | Audit log poisoning, false operational signals | COMMERCE |
| 2.8 | Validate `inventory_reservations` table RLS | Reserve/release must be service-role only to prevent race-condition bypass. | P0 | Yes | Low | Users can manipulate reservations directly → oversell | COMMERCE |
| 2.9 | Set up Supabase Branching for dev/staging DB | Isolate development schema changes from production data. | P2 | No | Medium | Schema changes tested only against local or shared staging DB | COMMERCE |
| 2.10 | Configure DB statement timeout (30s) | Prevent runaway queries from holding connections open. | P1 | No | Low | Connection pool starvation from slow queries | SOFT |
| 2.11 | Create non-privileged read-only user for analytics/BI | Separate monitoring dashboards from production credentials. | P3 | No | Low | Shared credentials, audit trail gaps | POST |

---

## 3. Vercel Deployment Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 3.1 | Connect Vercel project to GitHub repository | Automatic deployments from `master` branch. | P0 | Yes | Low | No deployment pipeline | SOFT |
| 3.2 | Configure production branch + preview branches | `master` → production, feature branches → preview URLs. | P1 | No | Low | Ambiguous deployment targets | SOFT |
| 3.3 | Set all environment variables in Vercel dashboard | Env vars must exist at deployment runtime. `.env` is local-only. | P0 | Yes | Low | Build fails or runtime errors in production | SOFT |
| 3.4 | Configure Vercel Production domain | Custom domain for the live site (e.g., `streetplayr.com`). | P0 | Yes | Low | No accessible URL | SOFT |
| 3.5 | Configure Vercel domain redirects (www → apex or vice versa) | Prevent SEO split and auth redirect mismatches. | P1 | No | Low | SEO dilution, auth callback URL mismatches | SOFT |
| 3.6 | Verify build output matches expected routes | Deploy and confirm all pages render (storefront, ops, API routes). | P1 | Yes (launch) | Low | Broken routes discovered post-launch | SOFT |
| 3.7 | Configure Vercel serverless function region (same as Supabase) | Reduce function cold-start + query latency. | P1 | No | Low | Cross-region latency (100–200 ms per request) | COMMERCE |
| 3.8 | Set Vercel `maxDuration` for serverless functions | Cron/reconciliation functions need >10s default. Default Vercel limit is 10s (Pro: 60s). | P1 | Yes (cron) | Low | Cron jobs timeout before completing → reconciliation never runs | SOFT |
| 3.9 | Configure Vercel automatic custom domains with SSL | Auto-provision and renew TLS certificates. | P0 | Yes | Low | No HTTPS → browser security warnings | SOFT |
| 3.10 | Configure Vercel Observability (logs, metrics) | Debug production issues without SSH access. | P1 | No | Low | Blind to production errors | SOFT |

---

## 4. Environment Variable Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 4.1 | `NEXT_PUBLIC_SUPABASE_URL` | Client + server Supabase client URL. | P0 | Yes | Low | No Supabase connectivity at all | SOFT |
| 4.2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-side and SSR Supabase access. | P0 | Yes | Low | Client auth, product queries, realtime all fail | SOFT |
| 4.3 | `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side DB access (bypasses RLS). | P0 | Yes | Low | All server actions, orchestration, cron, webhooks fail | SOFT |
| 4.4 | `STRIPE_SECRET_KEY` | Stripe API server-side (create PIs, refunds, webhook verification). | P0 | Yes (payments) | Low | Stripe integration entirely non-functional | COMMERCE |
| 4.5 | `STRIPE_WEBHOOK_SECRET` | Webhook signature verification. | P0 | Yes (payments) | Low | Stripe events processed without verification — anyone can POST fake events | COMMERCE |
| 4.6 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe Elements initialization. | P0 | Yes (checkout) | Low | Can't mount Stripe Elements → checkout broken | COMMERCE |
| 4.7 | `CRON_SECRET` | Bearer auth for `/api/cron/*` endpoints. Prevents public cron invocation. | P1 | Yes (cron) | Low | Anyone can trigger reconciliation / reservation release | SOFT |
| 4.8 | `NEXT_PUBLIC_BRAND_ID` | Commerce brand identifier for multi-brand queries. | P2 | No | Low | Brand-scoped queries default to fallback | SOFT |
| 4.9 | `NEXT_PUBLIC_PHONE_PREFIX` | Phone auth prefix (e.g., `+91` for India). | P2 | Yes (SMS auth) | Low | SMS OTP login broken | SOFT |
| 4.10 | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity CMS (Phase 3 — not yet implemented). | P3 | No | Low | No impact — Sanity has zero code | POST |
| 4.11 | `NEXT_PUBLIC_SANITY_DATASET` | Same as above. | P3 | No | Low | No impact | POST |
| 4.12 | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary (Phase 3 — not yet implemented). | P3 | No | Low | No impact | POST |
| 4.13 | Rotate all keys on regular schedule (quarterly) | Limit blast radius of key compromise. | P2 | No | Low | Compromised key grants indefinite access | COMMERCE |

---

## 5. Stripe Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 5.1 | Stripe account provisioned (Live mode) | Process real payments. All development uses Test mode. | P0 | Yes (payments) | Low | Cannot accept payments | COMMERCE |
| 5.2 | Stripe webhook endpoint created (prod URL) | Stripe pushes payment events (payment_intent.succeeded, etc.). Required for fulfillment. | P0 | Yes | Low | No webhook events → orders never transition past `pending_payment`, inventory never converts | COMMERCE |
| 5.3 | Stripe webhook signing secret registered in env vars | Verify webhook payloads are genuinely from Stripe. | P0 | Yes | Low | Anyone can forge webhook events → fake payment confirmations → free product fulfillment | COMMERCE |
| 5.4 | Checkout Stripe Elements integration (replace raw `<input>` fields) | PCI compliance. Raw credit card `<input>` fields pass card numbers through your server → PCI violation. | P0 | Yes | Medium | PCI non-compliance → fines, forced shutdown, legal liability | COMMERCE |
| 5.5 | Stripe PaymentIntent server actions implemented | Server-authoritative PaymentIntent creation and confirmation. | P0 | Yes | Medium | No payment flow at all | COMMERCE |
| 5.6 | Webhook event handler for `payment_intent.succeeded` | Transition order `pending_payment` → `confirmed`, convert reservations, log event. | P0 | Yes | Medium | Successful payments never fulfill orders | COMMERCE |
| 5.7 | Webhook event handler for `payment_intent.payment_failed` | Transition order to `failed`, release reservations, notify user. | P1 | No | Medium | Failed payments leave dangling reservations and no user feedback | COMMERCE |
| 5.8 | Webhook idempotency via Stripe `Idempotency-Key` header | Prevent duplicate webhook processing even if Stripe retries. | P1 | Yes | Low | Duplicate events → double fulfillment, double inventory deduction | COMMERCE |
| 5.9 | Stripe webhook signing secret rotation procedure | Rotate after any security incident or annually. | P2 | No | Low | Compromised secret = forged events indefinitely | COMMERCE |
| 5.10 | Stripe Dispute (chargeback) webhook handler | Listen for `chargeback.*` events, flag order, freeze fulfillment. | P1 | No | Medium | Chargeback items shipped without intervention → lost revenue + fees | COMMERCE |
| 5.11 | Strice refund webhook handler | Sync refund state to order status. | P1 | No | Medium | Orders show as paid after refund → reconciliation gap | COMMERCE |
| 5.12 | Test mode ↔ live mode switch not exposed to users | Prevent test-mode charges in production. | P0 | Yes | Low | Users could complete "purchases" that never settle | SOFT |

---

## 6. Domain + DNS Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 6.1 | Domain purchased and configured (e.g., `streetplayr.com`) | Production URL. | P0 | Yes | Low | Cannot go live without a domain | SOFT |
| 6.2 | DNS A/AAAA records or CNAME pointed to Vercel | Route traffic to Vercel edge network. | P0 | Yes | Low | Domain doesn't resolve → site unreachable | SOFT |
| 6.3 | SSL/TLS certificate provisioned (Vercel auto-manages) | HTTPS for all traffic. | P0 | Yes | Low | Browsers block or warn on HTTP | SOFT |
| 6.4 | SPF/DKIM/DMARC records for transactional email (if applicable) | Email deliverability — OTP, order confirmations. | P1 | Yes (email) | Medium | Auth/order emails land in spam | COMMERCE |
| 6.5 | CNAME for Supabase custom domain (auth redirects) | Avoid mixed-content and CORS issues on auth flows. | P1 | No | Medium | Auth popup blockers, redirect mismatches on some browsers | SOFT |

---

## 7. Auth Provider Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 7.1 | Supabase Auth configured (email/phone/OTP) | User authentication. Currently has phone-based OTP flow. | P0 | Yes | Low | No user registration or login | SOFT |
| 7.2 | OTP/SMS provider (Twilio) configured in Supabase | Phone OTP delivery. Required for phone-based auth. | P0 | Yes | Low | Phone login non-functional | SOFT |
| 7.3 | Google OAuth configured in Supabase (if used) | Social login option. | P2 | No | Low | Google login unavailable | SOFT |
| 7.4 | Auth email templates customized (branded) | Professional appearance for OTP and welcome emails. | P2 | No | Low | Generic Supabase-branded emails | SOFT |
| 7.5 | Auth session duration configured (JWT expiry) | Control how long users stay logged in. Default 1 hour. | P1 | No | Low | Inconvenient re-auth, or overly long sessions | SOFT |
| 7.6 | Auth redirect URLs allowlist configured | Prevent open redirect vulnerabilities via OAuth callback. | P0 | Yes | Low | Open redirect → phishing attack vector | SOFT |
| 7.7 | Auth rate limiting configured (Supabase project settings) | Prevent brute-force OTP guessing and SMS spam. | P1 | Yes | Low | Brute-force account compromise, SMS cost abuse | COMMERCE |
| 7.8 | SITE_URL + additional redirect URLs set in Supabase Auth settings | Auth redirects function correctly. Without this, OAuth and magic link callbacks fail. | P0 | Yes | Low | Auth callback loops, user can't complete login | SOFT |
| 7.9 | CORS origin allowlist configured in Supabase | Only your domain can make browser requests to Supabase. | P1 | No | Low | Any site can make authenticated requests from user's browser | SOFT |

---

## 8. SMS / OTP Provider Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 8.1 | Twilio account provisioned (or alternative SMS provider) | Deliver SMS OTP codes to users. | P0 | Yes | Low | Phone auth non-functional | SOFT |
| 8.2 | Twilio phone number purchased or sender ID registered | Outbound SMS requires an origin number/ID. | P0 | Yes | Low | No SMS delivery | SOFT |
| 8.3 | Twilio API credentials configured in Supabase | Supabase Auth uses Twilio to send OTPs. | P0 | Yes | Low | SMS delivery fails | SOFT |
| 8.4 | SMS content template compliant with carrier regulations | Some regions mandate sender ID registration and content templates. | P2 | No | Medium | SMS blocked by carriers in regulated markets | COMMERCE |
| 8.5 | SMS sending budget cap set | Prevent runaway SMS costs from abuse or bugs. | P1 | Yes | Low | Unexpected SMS bill from retry loops or brute-force attempts | COMMERCE |
| 8.6 | OTP rate limiting by phone number (Supabase + Twilio) | Max N OTPs per phone per hour. | P1 | Yes | Low | SMS spam, user frustration, carrier complaints | COMMERCE |

---

## 9. Webhook Infrastructure Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 9.1 | Stripe webhook endpoint URL reachable from Stripe servers | Endpoint must be public and accept POST. | P0 | Yes | Low | No payment events processed | COMMERCE |
| 9.2 | Stripe webhook signing secret stored and loaded | Verify payload authenticity. | P0 | Yes | Low | Unverified event processing | COMMERCE |
| 9.3 | Webhook idempotency guard implemented and tested | Prevent duplicate processing on Stripe retries. | P1 | Yes | Medium | Double-charge, double-fulfillment | COMMERCE |
| 9.4 | Webhook timeout handling (Stripe expects <5s response) | If handler exceeds 5s, Stripe retries. Use async pattern + immediate 200. | P1 | No | Medium | Stripe retries accumulate, idempotency key window may expire | COMMERCE |
| 9.5 | Webhook error response handling | Return 4xx for bad payloads, 5xx for transient failures. | P1 | No | Low | Stripe retries with delays on 5xx, stops on 4xx | COMMERCE |
| 9.6 | Webhook monitoring / alerting | Detect webhook failures before they accumulate. | P1 | No | Medium | Silent payment processing failures | COMMERCE |
| 9.7 | Webhook replay safety (Stripe dashboard replay) | Stripe can replay events. Ensure replayed events are caught by idempotency and don't double-process. | P1 | No | Low | Manual replay during debugging → double fulfillment | COMMERCE |
| 9.8 | Webhook secret rotation procedure | Rotate on incident or annually. | P2 | No | Low | Compromised secret grants indefinite event-forging ability | COMMERCE |

---

## 10. Cron Job Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 10.1 | Reservation expiry cron (`*/5 * * * *`) releases held reservations >15 min | Prevent abandoned checkouts from permanently locking inventory. | P0 | Yes | Low | Inventory leaks: abandoned reservations never release → phantom stockouts | COMMERCE |
| 10.2 | Reconciliation cron (`*/15 * * * *`) handles orphaned payments + stale reservations | Catch missed transitions: payment completed but order still `pending_payment`, or reservation stuck. | P1 | Yes | Medium | Silent state drift accumulates → inventory inconsistency, payment gaps | COMMERCE |
| 10.3 | Cron job authorization (CRON_SECRET Bearer token) | Prevent unauthorized cron invocation. | P1 | Yes | Low | Anyone can trigger expensive reconciliation or release all reservations | SOFT |
| 10.4 | Cron idempotency guard (window-based lock) | Prevent overlapping cron runs. | P1 | Yes | Medium | Concurrent reconciliation → double-processing, race conditions | COMMERCE |
| 10.5 | Cron execution logging | Audit trail for reconciliation actions. | P2 | No | Low | No visibility into cron effectiveness | COMMERCE |
| 10.6 | Cron failure alerting (email/Slack) | Know when cron stops running. | P1 | No | Medium | Silent cron failure → inventory + payment drift | COMMERCE |
| 10.7 | Verify `maxDuration` allows cron handler completion | Cron queries (reconciliation) may take >10s. Vercel Pro allows 60s for serverless functions. | P1 | Yes | Low | Cron times out mid-execution → partial reconciliation | SOFT |

---

## 11. Realtime Infrastructure Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 11.1 | Supabase Realtime enabled on required tables (`profiles`, `product_variants`) | Live wallet balance and stock updates without page refresh. | P1 | No | Low | Users must manually refresh to see wallet/stock changes | COMMERCE |
| 11.2 | Realtime channel rate limits understood (Supabase Free: 20 concurrent channels) | Prevent exceeding channel limit under load. | P2 | No | Low | Users disconnected when channel limit reached | COMMERCE |
| 11.3 | Realtime authentication (RLS for Realtime) | Ensure users only receive updates they're authorized for (own wallet, public stock). | P0 | Yes | Medium | Users can subscribe to other users' wallet updates | COMMERCE |
| 11.4 | Realtime disconnect/reconnect handling | Users on mobile or unstable networks need graceful reconnection. | P2 | No | Medium | Stale data shown after reconnect | COMMERCE |

---

## 12. Security Hardening Requirements

| # | Item | Purpose | Pri | Blocking | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|---|
| 12.1 | All RLS policies audited and verified | Ensure users can only access own data, ops users only ops scopes. | P0 | Yes | Medium | Data breach (orders, wallet, personal info leaked) | SOFT |
| 12.2 | Security headers configured (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) | Mitigate XSS, clickjacking, MIME-type sniffing. Already in `next.config.ts`. | P1 | Yes | Low | Clickjacking, XSS vectors | SOFT |
| 12.3 | CSP (Content Security Policy) header configured | Restrict script/style sources, prevent XSS. Not yet implemented. | P1 | No | Medium | Stored/reflected XSS can execute arbitrary JS | SOFT |
| 12.4 | Rate limiting on auth endpoints (Supabase project settings) | Prevent brute-force attacks on phone/email auth. | P1 | Yes | Low | Account takeover via OTP brute-force | SOFT |
| 12.5 | Rate limiting on API routes (Vercel WAF or custom middleware) | Prevent abuse of server actions and API routes. | P2 | No | Medium | Scripted abuse of commerce endpoints | COMMERCE |
| 12.6 | SQL injection prevention (parametrized queries via Supabase client) | All queries go through Supabase JS client which uses parameterized queries. Verify no raw SQL. | P0 | Yes | Low | DB injection via unescaped query fragments | SOFT |
| 12.7 | Auth gateway middleware guards all ops routes | Prevent non-ops users from accessing `/ops/*`. Verified: middleware + layout double-gating in place. | P0 | Yes | Low | Unauthorized ops dashboard access | SOFT |
| 12.8 | Supabase `service_role` key never exposed to client | Admin client only imported in server contexts. Verify via bundle analysis. | P0 | Yes | Low | Service role key leaked in browser → full DB compromise | SOFT |
| 12.9 | Environment variable validation blocks missing production vars | Prevent silent failures in production. Already implemented in `lib/env/validate.ts`. | P0 | Yes | Low | Silent empty-state failures, corrupted commerce state | SOFT |
| 12.10 | Webhook signature verification enabled | In production, `STRIPE_WEBHOOK_SECRET` is required and verification enforced. Already implemented with fallback for dev. | P0 | Yes | Low | Forged webhook events → fake payments, free fulfillment | COMMERCE |

---

## 13. RLS Verification Requirements

| # | Table | Risk if Misconfigured | Pri | Gate |
|---|---|---|---|---|
| 13.1 | `profiles` | Users can read/modify other users' profiles, wallet balances, roles | P0 | SOFT |
| 13.2 | `orders` | Users can read/modify other users' orders, payment status | P0 | SOFT |
| 13.3 | `order_items` | Users can see what others ordered | P0 | SOFT |
| 13.4 | `cart_items` | Users can see/modify other users' carts | P1 | SOFT |
| 13.5 | `inventory_reservations` | Users can manipulate reservations → oversell, inventory corruption | P0 | COMMERCE |
| 13.6 | `wallet_transactions` | Users can see other users' transaction history, balances | P0 | SOFT |
| 13.7 | `product_variants` | Stock quantity modifiable by users (should be service-role only for writes) | P1 | COMMERCE |
| 13.8 | `idempotency_keys` | Users can see or corrupt idempotency state → duplicate payment processing | P1 | COMMERCE |
| 13.9 | `operational_events` | Users can inject fake audit events | P1 | COMMERCE |
| 13.10 | `releases` (drops) | Create/update authority must be ops-only | P1 | SOFT |
| 13.11 | `release_products` | Same as above | P1 | SOFT |

---

## 14. Production Monitoring Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 14.1 | Vercel Analytics enabled (or equivalent) | Track page views, Core Web Vitals, visitor geography. | P2 | Low | No visibility into real user performance | SOFT |
| 14.2 | Vercel Observability (function logs + metrics) | Debug server action failures, API route errors, cold starts. | P1 | Low | Blind debugging of production issues | SOFT |
| 14.3 | Health check endpoint monitored (GET /api/health) | External uptime monitoring (Pingdom, Better Uptime, etc.). Already implemented. | P1 | Low | No external signal if site goes down | SOFT |
| 14.4 | Supabase database monitoring (CPU, connections, storage) | Detect connection pool exhaustion, slow queries, storage growth. | P1 | Low | Capacity surprises during traffic spikes | COMMERCE |
| 14.5 | Supabase Logs explorer usage | Debug auth failures, Realtime errors, SQL errors. | P2 | Low | Slow incident investigation | SOFT |
| 14.6 | Custom dashboards (Grafana / Datadog) for business metrics | Orders/hour, revenue, conversion rate, reservation fill rate. | P3 | High | No business-level observability | POST |

---

## 15. Logging / Observability Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 15.1 | Structured logging on all server actions + API routes | Each request logs method, path, user, duration, result. | P1 | Medium | Cannot trace specific user issues, audit trail gaps | SOFT |
| 15.2 | Payment event logging (immutable `operational_events` table) | Full audit trail of payment lifecycle. Already implemented via `EventService.recordEvent()`. | P0 | Low | No audit trail for financial events → compliance failure | COMMERCE |
| 15.3 | Cron execution logging | Each cron run logs start/end/duration/items-processed. | P1 | Low | No way to verify cron effectiveness | COMMERCE |
| 15.4 | Failed webhook payloads logged (without sensitive data) | Debug webhook processing failures. | P1 | Low | Cannot diagnose webhook issues | COMMERCE |
| 15.5 | Auth event logging (login, logout, OTP sent, role changes) | Security audit trail. | P2 | Low | No visibility into auth anomalies | COMMERCE |
| 15.6 | Log retention policy (30 days minimum, 90 for payment events) | Compliance requirements for payment data. | P2 | Low | Audit data lost before compliance window expires | COMMERCE |

---

## 16. Error Tracking Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 16.1 | Sentry (or equivalent) error tracking integrated | Catch unhandled exceptions, React render errors, API 5xx with stack traces + context. | P1 | Medium | Blind to production crashes until user reports | SOFT |
| 16.2 | Source maps uploaded to Sentry | Stack traces map to readable TypeScript, not minified output. | P1 | Low | Useless stack traces in Sentry | SOFT |
| 16.3 | Sentry performance tracing enabled | Track slow server actions, API routes, page loads. | P2 | Low | No insight into what's slow | COMMERCE |
| 16.4 | Error boundary fallback UI polished | If React crashes, show branded error page (not white screen). Already implemented in `error.tsx` + LuxuryError component. | P1 | Low | White screen on crash | SOFT |
| 16.5 | Alert on error threshold (e.g., >5% error rate in 5 min) | Proactive notification before user complaints. | P2 | Medium | Incident detected only after user reports | COMMERCE |

---

## 17. Backup / Recovery Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 17.1 | Supabase daily backups configured (Pro plan feature) | Recover from accidental data loss or corruption. | P1 | Low | Permanent data loss on incident | COMMERCE |
| 17.2 | Point-in-time recovery enabled | Restore to within 1 minute of incident (7-day window). | P2 | Low | Lose up to 24h of data on restore | COMMERCE |
| 17.3 | Backup restore drill performed | Verify backups actually work. Untested backup = no backup. | P1 | Medium | False confidence — backup may be corrupted or incomplete | COMMERCE |
| 17.4 | Database migration rollback plan documented | Know exactly which migration to revert and how. | P1 | Low | Can't roll back bad migration without data loss | COMMERCE |
| 17.5 | Git tag for each production deployment | Pinpoint which code version was running at any point. | P2 | Low | Cannot correlate issues with deployment version | SOFT |

---

## 18. Rate Limiting Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 18.1 | Auth rate limiting (Supabase built-in) | OTP send limits, max failed attempts. | P0 | Low | Brute-force OTP guessing → account takeover | SOFT |
| 18.2 | Server action rate limiting (custom or Vercel WAF) | Prevent abuse of checkout, reservation, and order submission actions. | P1 | Medium | Bot can create thousands of reservations → inventory denial-of-service | COMMERCE |
| 18.3 | API route rate limiting | Health check endpoint needs no limit; cron and webhook need IP allowlisting. | P1 | Medium | Webhook replay attacks, cron abuse | COMMERCE |
| 18.4 | Stripe rate limit awareness (Stripe has API rate limits) | Implement retry-with-backoff for Stripe API calls. | P2 | Low | Burst calls to Stripe API rejected → payment failures | COMMERCE |

---

## 19. Performance Optimization Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 19.1 | Static page generation for content pages (`/about`, `/collections`, `/lookbook`, `/journal`) | Faster load times, reduced server load. Currently all pages are dynamic due to root layout calling `getProfileAction()`. | P1 | Medium | All pages server-rendered → higher load, slower TTFB | COMMERCE |
| 19.2 | Image optimization (Next.js Image component + Cloudinary) | Responsive images, WebP/AVIF, lazy loading. | P1 | Medium | Heavy unoptimized images → slow page loads, high bandwidth | COMMERCE |
| 19.3 | Bundle analysis and code splitting | Ensure third-party libraries are tree-shaken, no duplicate chunks. | P2 | Medium | Bloated JS bundle → slow page loads on mobile | COMMERCE |
| 19.4 | Vercel Edge caching for static pages | Reduce origin load for cacheable content. | P2 | Low | Higher origin server load | COMMERCE |
| 19.5 | Cold start optimization for serverless functions | Minimize dependencies in server action files, use smaller packages. | P2 | Medium | Slow initial load on infrequently-accessed pages (OpsOS) | COMMERCE |
| 19.6 | Database query optimization (indexes, query plans) | Verify all queries use indexes (migration 00005 added key indexes). | P1 | Low | Slow queries under load → timeout → 5xx | COMMERCE |

---

## 20. SSR / Hydration Verification Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 20.1 | Verify no `window`/`document` access during SSR | Prevent "ReferenceError: window is not defined" crashes. | P0 | Low | SSR crash → page doesn't render at all | SOFT |
| 20.2 | Verify client components have `'use client'` directive properly placed | Hydration mismatches when server/client render different trees. | P0 | Low | Hydration mismatch → React errors, UI flicker | SOFT |
| 20.3 | Verify `useSearchParams()` is wrapped in `<Suspense>` | Next.js errors if accessed without Suspense boundary. | P1 | Low | Build-time error ("missing Suspense boundary") | SOFT |
| 20.4 | Verify headers/cookies SSR calls use `next/headers` (dynamic rendering) | Pages that read cookies are automatically dynamic. Root layout reads cookies → all pages dynamic. | P1 | Low | All pages are dynamic = no static optimization | SOFT |
| 20.5 | Hydration test on slow 3G + low-end device | Real-world mobile experience verification. | P2 | Medium | Poor mobile UX undetected until real users | COMMERCE |

---

## 21. Reconciliation System Requirements

| # | Item | Purpose | Pri | Complexity | Risk if Skipped | Gate |
|---|---|---|---|---|---|---|
| 21.1 | Orphaned payment reconciliation | Find PaymentIntent `succeeded` orders still stuck in `pending_payment`. | P1 | Medium | Payments succeed but orders never fulfill | COMMERCE |
| 21.2 | Stale reservation reconciliation | Find reservations past TTL that cron missed releasing. | P1 | Low | Inventory leaked, phantom stockouts | COMMERCE |
| 21.3 | Idempotency key cleanup | Expired idempotency keys accumulate in `idempotency_keys` table. | P2 | Low | Table bloat over time | COMMERCE |
| 21.4 | Reconciliation run logging | Each cycle logs items found + actions taken. | P1 | Low | No audit of reconciliation effectiveness | COMMERCE |
| 21.5 | Reconciliation dry-run mode | Preview what reconciliation would do without executing. | P2 | Medium | Dangerous reconciliation bugs discovered in production | COMMERCE |

---

## 22. Reservation Lifecycle Requirements

| # | State | Transition | Risk if Broken | Gate |
|---|---|---|---|---|
| 22.1 | `pending` → `held` | User initiates checkout → stock reserved | Oversell (two users hold same item) | COMMERCE |
| 22.2 | `held` → `converted` | Payment confirmed → reservation becomes order | Inventory never decremented | COMMERCE |
| 22.3 | `held` → `expired` | TTL reached (15 min) → auto-release | Phantom stockout, abandoned carts lock inventory | COMMERCE |
| 22.4 | `held` → `released` | User cancels checkout → release | Inventory stuck in limbo | COMMERCE |
| 22.5 | `converted` → never, terminal | Reservations are consumed after conversion | N/A | N/A |
| 22.6 | Concurrent reservation prevention | Same variant reserved by two users simultaneously | Oversell | COMMERCE |

---

## 23. Operational Testing Requirements

| # | Test Scenario | Purpose | Gate |
|---|---|---|---|
| 23.1 | Full checkout flow: browse → add to cart → initiate checkout → Stripe payment → webhook → order confirmed → inventory decremented | End-to-end payment + fulfillment verification | COMMERCE |
| 23.2 | Reservation expiry + release | Verify cron releases expired reservations, inventory replenishes | COMMERCE |
| 23.3 | Webhook replay: submit same event twice | Verify idempotency prevents double fulfillment | COMMERCE |
| 23.4 | Duplicate payment: same PaymentIntent processed twice | Verify guard against double charge + double fulfillment | COMMERCE |
| 23.5 | Auth persistence: session survives page refresh, browser close | Verify SSR cookie-based auth works end-to-end | SOFT |
| 23.6 | OpsOS RBAC: member → ops page → redirect | Verify auth gateway blocks unauthorized ops access | SOFT |
| 23.7 | Realtime disconnect/reconnect: kill network, restore | Verify RealtimeProvider handles reconnection gracefully | COMMERCE |
| 23.8 | Deployment rollback: deploy bad code, revert | Verify Vercel instant rollback works without data loss | SOFT |
| 23.9 | Cron overlap: trigger reconciliation twice in same window | Verify idempotency lock prevents concurrent execution | COMMERCE |
| 23.10 | Payment failure: card declined → order failed → reservation released | Verify failure path integrity | COMMERCE |
| 23.11 | OTP flow: request OTP → enter correct code → logged in | Verify phone auth flow | SOFT |
| 23.12 | OTP flow: enter wrong code → rejected | Verify auth error handling | SOFT |
| 23.13 | Empty state: new user with no orders, no wallet, no cart | Verify UI doesn't crash on empty data | SOFT |
| 23.14 | Network error: disconnect during checkout | Verify error boundaries catch and display properly | SOFT |
| 23.15 | Load test: simulate N concurrent checkout initiations | Verify atomic RPC + reservation concurrency | COMMERCE |

---

## 24. Soft-Launch Requirements

| # | Item | Purpose | Gate |
|---|---|---|---|
| 24.1 | Invite-only access (turnstile, access code, or allowlisted phones) | Control user influx during validation period. | SOFT |
| 24.2 | Small, real product catalog (5–10 drops) | Validate product management workflow. | SOFT |
| 24.3 | Manual order fulfillment process defined | Before Stripe, orders are "free" — test backend with fake PIs. | SOFT |
| 24.4 | Support contact method (email or in-app) | Users need a way to report issues. | SOFT |
| 24.5 | Maximum 50–100 users | Limit blast radius of unknown issues. | SOFT |
| 24.6 | Daily reconciliation check (manual or cron) | Catch state drift early. | SOFT |
| 24.7 | Backup export of `orders`, `wallet_transactions`, `inventory_reservations` | Preserve data if incident requires restore. | SOFT |
| 24.8 | Known issues documented + communicated to test users | Set expectations, reduce support load. | SOFT |

---

## 25. Go-Live Blockers (Pre-Flight)

These must be resolved before any live traffic hits the site:

| # | Item | Ref | Reason |
|---|---|---|---|
| B1 | Supabase production project created and migrations applied | 1.1, 2.1 | No data layer |
| B2 | Vercel project created, env vars configured, domain connected | 3.1, 3.4, 4.1–4.3 | No deployment target |
| B3 | SSL/TLS certificate provisioned | 6.3 | Browsers block HTTP |
| B4 | Auth provider (Supabase Auth) configured with SMS/OTP | 7.1, 7.2, 8.1–8.3 | No user registration/login |
| B5 | Security headers configured | 12.2 | Clickjacking/XSS prevention |
| B6 | Auth redirect allowlist configured | 7.6 | Open redirect vulnerability |
| B7 | RLS policies verified on `profiles`, `orders`, `wallet_transactions` | 13.1, 13.2, 13.6 | Data breach |
| B8 | Env validation blocks missing production vars | 12.9 | Silent failures |
| B9 | Error boundaries render branded fallback | 16.4 | White screen on crash |
| B10 | SSR `window is not defined` / hydration verified | 20.1, 20.2 | Pages crash on load |

---

## 26. Pre-Stripe Requirements (Before Payment Activation)

These must be resolved before accepting real payments:

| # | Item | Ref | Reason |
|---|---|---|---|
| S1 | Stripe Live account provisioned | 5.1 | Cannot accept payments |
| S2 | Stripe webhook endpoint created | 5.2 | No payment event processing |
| S3 | Stripe webhook signing secret stored | 5.3 | Forged events → fake payments |
| S4 | Stripe Elements integration (replace raw `<input>` fields) | 5.4 | PCI violation |
| S5 | PaymentIntent server actions implemented | 5.5 | No payment flow |
| S6 | Webhook handler for `payment_intent.succeeded` | 5.6 | Payments never fulfilled |
| S7 | Webhook idempotency tested | 9.3 | Double fulfillment on retry |
| S8 | Reservation ←→ Payment lifecycle verified | 22.1–22.6 | Inventory corruption |
| S9 | Stripe publishable key configured (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) | 4.6 | Checkout Elements won't mount |
| S10 | Stripe secret key configured (`STRIPE_SECRET_KEY`) | 4.4 | Server-side Stripe API calls fail |

---

## 27. Pre-Orders Requirements (Before Real Orders)

These must be resolved before the first real order is fulfilled:

| # | Item | Ref | Reason |
|---|---|---|---|
| O1 | Reservation expiry cron deployed and working | 10.1 | Inventory leaks |
| O2 | Reconciliation cron deployed and working | 10.2 | Payment/order state drift |
| O3 | `maxDuration` configured for cron functions | 3.8 | Cron times out mid-execution |
| O4 | CRON_SECRET configured | 4.7 | Unauthorized cron access |
| O5 | Stripe Dispute webhook handler | 5.10 | Chargeback fulfillment ambiguity |
| O6 | Stripe Refund webhook handler | 5.11 | Refund sync gap |
| O7 | Auth rate limiting configured | 7.7 | OTP brute-force pre-checkout |
| O8 | SMS budget cap set | 8.5 | Cost abuse during checkout flow |
| O9 | OTP rate limiting configured | 8.6 | SMS spam during registration |
| O10 | Connection pooler (PgBouncer) configured | 1.4 | Connection exhaustion under order load |
| O11 | Inventory RLS verified (service-role only for writes) | 13.5, 13.7 | Users manipulate inventory |

---

## 28. Safe to Postpone (Post-Launch)

| # | Item | Ref | Rationale |
|---|---|---|---|
| P1 | CSP header | 12.3 | XSS risk exists but lower prio than core commerce |
| P2 | Image optimization (Cloudinary) | 19.2 | Performance enhancement, not launch blocker |
| P3 | Vercel caching for static pages | 19.4 | Performance optimization |
| P4 | Analytics dashboard (Grafana) | 14.6 | Nice to have, not essential |
| P5 | Sanity CMS integration | 4.10, 4.11 | Phase 3, zero code exists |
| P6 | Cloudinary integration | 4.12 | Phase 3, zero code exists |
| P7 | Rate limiting on API routes | 18.2 | Important but can be added post-launch |
| P8 | 80%+ test coverage | — | Essential for safety but not launch-critical |
| P9 | Transactional email templates | 7.4 | Branding enhancement |
| P10 | Key rotation schedule | 4.13 | Operational best practice |

---

## 29. Summary: Minimum Viable Production Stack

Before any live traffic (even invite-only), you need these **12 items**:

```
┌─────────────────────────────────────────────────────┐
│  MVP PRODUCTION STACK                               │
├─────────────────────────────────────────────────────┤
│  1. Supabase production project                      │
│  2. Migrations 00001–00005 applied                   │
│  3. Vercel project + domain                          │
│  4. SSL/TLS certificate                              │
│  5. Core env vars (URL + anon + service_role)        │
│  6. Supabase Auth configured (phone OTP + Twilio)    │
│  7. Auth redirect allowlist + SITE_URL               │
│  8. RLS verified on profiles, orders, wallet         │
│  9. Security headers deployed                        │
│ 10. Error boundaries in place                        │
│ 11. Auth gateway (ops route protection)              │
│ 12. Env validation blocks missing production vars    │
└─────────────────────────────────────────────────────┘
```

Before Stripe activation, add these **6 items**:

```
┌─────────────────────────────────────────────────────┐
│  PRE-STRIPE GATE                                    │
├─────────────────────────────────────────────────────┤
│  1. Stripe Live account + webhook endpoint           │
│  2. Webhook signing secret verified                  │
│  3. Stripe Elements replaces raw <input> fields      │
│  4. PaymentIntent server actions                     │
│  5. payment_intent.succeeded handler                 │
│  6. Webhook idempotency                              │
└─────────────────────────────────────────────────────┘
```

Before real orders, add these **8 items**:

```
┌─────────────────────────────────────────────────────┐
│  PRE-ORDERS GATE                                    │
├─────────────────────────────────────────────────────┤
│  1. Reservation expiry cron active                   │
│  2. Reconciliation cron active                       │
│  3. maxDuration configured for cron functions        │
│  4. CRON_SECRET configured                           │
│  5. PgBouncer connection pooler enabled              │
│  6. Auth rate limiting + SMS budget cap              │
│  7. OTP rate limiting                                │
│  8. Inventory RLS verified (writes = service-role)   │
└─────────────────────────────────────────────────────┘
```

---

*Generated for StreetPlayR production launch planning. Review quarterly and update as infrastructure evolves.*
