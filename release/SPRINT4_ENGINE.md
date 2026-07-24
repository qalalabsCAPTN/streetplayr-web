# Sprint 4 — Engine First (UI Frozen)

Order locked by PO 2026-07-24. Sprint 5 UI / client feedback NOT before this green.

## Sequence

1. Admin Hardening (P0) — ~3h
2. Cart Schema (P0) — ~4–5h
3. Commerce Pipeline (P0) — 2–3d
4. Inventory Reservation (P1) — 1d
5. NECTAR Runtime (P1) — 2d
6. Regression + E2E Journey Audit matrix

Then Sprint 5 UI. Then Sprint 6 perf/SEO/launch.

## Audit links

- Admin: agent `8a8e7e51-de9d-47c8-9977-ac47d74b5bb5`
- Commerce/Cart/Inv/NECTAR: agent `fc8da286-1a1f-4be5-b810-f66ad4004729`

## Live path today (broken)

```
Zustand cart → demo checkout (no reserve) → confirmDemoOrder → success
```

Stripe / Easebuzz / NECTAR / reservation RPCs = orphan stacks.

## Do not

- Client feedback UI PRs
- Glass / nav / homepage polish
- Demo shortcuts in prod path
