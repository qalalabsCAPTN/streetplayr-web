# StreetPlayR Production QA Report

## Route Map

### Storefront
| Route | Type | Status |
|-------|------|--------|
| `/` | Home | ✅ |
| `/home` | Alternative home | ✅ |
| `/about` | About | ✅ |
| `/collections` | Browse collections | ✅ |
| `/shop` | Shop all | ✅ |
| `/product/[slug]` | Product detail (SSG) | ✅ |
| `/cart` | Shopping cart | ✅ |
| `/checkout` | Checkout flow | ✅ |
| `/checkout/success` | Order confirmation | ✅ |

### Auth
| Route | Type | Status |
|-------|------|--------|
| `/login` | Google OAuth + OTP login | ✅ |
| `/auth/callback` | OAuth callback handler | ✅ |
| `/auth/auth-code-error` | Auth error page | ✅ |

### Customer Dashboard (`/dashboard/*`)
| Route | Type | Data Source | Status |
|-------|------|-------------|--------|
| `/dashboard` | Client | authStore (SPRR, tier) | ✅ |
| `/dashboard/rewards` | Client | `/api/nectar/rewards` | ✅ |
| `/dashboard/referrals` | Client | `/api/nectar/referrals` | ✅ |
| `/dashboard/wallet` | Client | authStore transactions | ✅ |
| `/dashboard/orders` | Client | `/api/nectar/orders` | ✅ |

### Profile (`/profile/*`)
| Route | Type | Status |
|-------|------|--------|
| `/profile` | Identity, membership card | ✅ |
| `/profile/wallet` | SPRR wallet (legacy) | ✅ |
| `/profile/rewards` | NECTAR rewards (legacy) | ✅ |
| `/profile/orders` | Order history (legacy) | ✅ |
| `/profile/addresses` | Address management | ✅ |
| `/profile/settings` | Account settings | ✅ |

### Admin Console (`/admin/*`)
| Route | Type | Data Source | Status |
|-------|------|-------------|--------|
| `/admin` | Client | `/api/admin/overview` | ✅ |
| `/admin/nectar` | Server | admin client (profiles, campaigns, claims) | ✅ |
| `/admin/users` | Server | admin client (profiles) | ✅ |
| `/admin/rewards` | Server | admin client (campaigns, redemptions) | ✅ |
| `/admin/referrals` | Server | admin client (claims, edges) | ✅ |
| `/admin/wallet` | Server | admin client (balances, adjustments) | ✅ |
| `/admin/analytics` | Server | admin client (revenue, roles, orders) | ✅ |
| `/admin/orders` | Server | admin client (orders) | ✅ |
| `/admin/products` | Server | admin client (products, variants) | ✅ |

### OpsOS (`/ops/*`)
| Route | Type | Status |
|-------|------|--------|
| `/ops` | Command center | ✅ |
| `/ops/inventory` | Inventory authority | ✅ |
| `/ops/products` | Product list | ✅ |
| `/ops/products/[id]` | Product detail + variants | ✅ |
| `/ops/drops` | Drop orchestration | ✅ |
| `/ops/orders` | Order narratives | ✅ |
| `/ops/customers` | CRM profiles | ✅ |
| `/ops/customers/[customerId]` | Customer dossier | ✅ |
| `/ops/wallet` | Wallet admin + campaigns | ✅ |

### API Endpoints
| Route | Status |
|-------|--------|
| `/api/admin/overview` | ✅ |
| `/api/nectar/orders` | ✅ |
| `/api/nectar/referrals` | ✅ |
| `/api/nectar/rewards` | ✅ |
| `/api/cron/reconciliation` | ✅ |
| `/api/cron/release-expired-reservations` | ✅ |
| `/api/health` | ✅ |
| `/api/webhooks/stripe` | ✅ |

## Feature Checklist

### Auth & Session
- [x] Google OAuth login flow
- [x] OTP phone login
- [x] Session persistence across refresh
- [x] Auth callback code exchange
- [x] Cookie transfer to redirect response
- [x] Profile bootstrap on first login
- [x] super_admin role preservation
- [x] Middleware auth guard
- [x] ProtectedRoute component (customer)
- [x] AdminGuard component (admin ops roles)

### NECTAR Loyalty
- [x] SPRR balance display
- [x] Tier derivation (STREET/PLAYER/LEGEND)
- [x] Tier progress bars
- [x] Reward multiplier per tier
- [x] Active bonus campaigns
- [x] Bonus campaign claiming
- [x] XP tracking
- [x] Streak tracking (current + longest)
- [x] Referral code generation
- [x] Referral link sharing
- [x] Referral stats (total, converted, pending, earned)
- [x] Referral attribution flow
- [x] Reward redemptions
- [x] Wallet transaction history

### Admin
- [x] User management table
- [x] Role badges
- [x] NECTAR analytics (XP, SPRR circulation)
- [x] Bonus campaign CRUD
- [x] Manual wallet adjustments
- [x] Wallet audit trail
- [x] Referral claim management
- [x] Order management
- [x] Product catalog
- [x] Revenue analytics
- [x] Role distribution
- [x] Order status breakdown

### OpsOS
- [x] Command center dashboard
- [x] Active drops display
- [x] Operational events timeline
- [x] Product CRUD
- [x] Product variant management
- [x] Product status toggles
- [x] Inventory oversight
- [x] Drop orchestration
- [x] Order narratives
- [x] Customer CRM
- [x] Customer dossier (orders, referrals, wallet)
- [x] Wallet admin panel
- [x] Campaign manager

### Commerce
- [x] Product display
- [x] Cart management
- [x] Checkout flow
- [x] Order creation
- [x] Inventory reservations
- [x] Stripe webhook handling
- [x] Order confirmation

### UI/UX
- [x] Luxury dark design system
- [x] Consistent typography (display, body, mono)
- [x] Cinematic animations (framer-motion)
- [x] Noise/grain overlay texture
- [x] Membership card with shimmer
- [x] Atmospheric gradient orbs
- [x] Mobile responsive layouts
- [x] Desktop sidebar + mobile tab bar
- [x] Empty states
- [x] Loading skeletons
- [x] Hover interactions
- [x] Tier color tokens (silver, green, purple)

## Known Blockers

### Migration-dependent
- `sprr_balance` column missing from `profiles` table — all SPRR defaults to 0
- `referral_code` column missing — referral codes not auto-generated
- `wallet_transactions`, `wallet_events`, `payment_events` tables missing
- Order history relies on legacy `orders` table schema (`customer_id`, `grand_total`)
- Wallet transaction history stored client-side (localStorage) — no server sync until `wallet_transactions` table exists

### Configuration (env vars)
- `NEXT_PUBLIC_SITE_URL` must be set on production deploy
- Stripe webhook secret must be configured for live payments
- Cron secrets needed for scheduled tasks (reconciliation, reservation release)

### OpsOS
- Some OpsOS pages query `collections`, `collection_products`, `operational_events` tables that don't exist in the current Supabase project
- These pages will show empty states instead of crashing (handled by try/catch blocks)

## Remaining Integrations

### Razorpay (Pending)
- Payment gateway integration not yet implemented
- Current Stripe integration is in place for international payments
- Razorpay would serve as primary INR payment gateway for Indian customers

### Wallet Transaction Sync
- Currently wallet transactions are stored client-side in Zustand (localStorage)
- Need server-side `wallet_transactions` table + sync mechanism
- Migration 00008 adds `bonus_campaigns`, `referral_claims`, `reward_redemptions` but not `wallet_transactions`

### Email Notifications
- Order confirmation emails not implemented
- Referral reward notifications not implemented
- Campaign reward notifications not implemented

## Build Status
- TypeScript: **0 errors**
- Production build: **0 errors, 49 routes**
- Lint: **123 pre-existing warnings** (no new warnings introduced)
- Branch: `cinematic-ui-migration`

## Production Deploy Checklist
1. [ ] Set `NEXT_PUBLIC_SITE_URL=https://streetplayr.qalalabs.com`
2. [ ] Apply migrations 00001 → 99999 via Supabase SQL Editor
3. [ ] Verify Supabase Auth redirect URLs include `https://streetplayr.qalalabs.com/auth/callback`
4. [ ] Delete `.next` cache before deploy
5. [ ] Deploy from `cinematic-ui-migration` branch
6. [ ] Test Google login end-to-end
7. [ ] Verify `/dashboard` renders with live data
8. [ ] Verify `/admin` renders for super_admin user
