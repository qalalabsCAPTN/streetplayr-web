# Platform ID Contract

> Phase 7 deliverable. Reconciles platform/site naming across NECTAR's `platforms` table, StreetPlayR's `sites` table, and the ecosystem-ops UI's `PlatformId` TypeScript union — three places that currently disagree.

## What's actually live today (verified, not proposed)

**NECTAR `platforms` table** (real rows, queried 2026-08-18):
```
streetplayr    — StreetPlayR       — active
playr          — playR             — active
letsplay       — LetsPlay          — active
nectar-internal — NECTAR Internal  — active
```
**This is already the clean canonical set** — `id`s are `streetplayr`, `playr`, `letsplay`, no `-game`/`-club` suffixing. Whoever seeded the live `platforms` table already did the reconciliation this phase was asked to figure out — it just was never propagated to the other two places below. (`0003_seed_platforms.sql`, the checked-in migration file, describes a *different*, messier set — `playr-game`, `playr-club` — meaning the live table was hand-corrected at some point after that migration ran, or was never seeded from that file at all. Either way, the live table, not the migration file, is the current ground truth.)

**StreetPlayR `sites` table**: only one row, `streetplayr`. No `playr`/`letsplay`/`playrclub` rows exist yet.

**`types/ops2/ops.ts::PlatformId`** (StreetPlayR's ecosystem-ops UI layer): `'all' | 'streetplayr' | 'playr' | 'playr-club' | 'playr-game'` — **disagrees with the live NECTAR `platforms` table on two of three non-StreetPlayR ids** (`playr-club` vs `letsplay`, `playr-game` vs nothing — NECTAR has no game-branded platform at all, `playr` already covers it).

NECTAR's own `apps/ecosystem-ops/src/types/ops.ts::PlatformId` has the same mismatch independently (confirmed in the Phase 0 audit) — both UI layers drifted from the real seed data the same way, likely because both were written against the *migration file's* placeholder ids, not the corrected live data.

## Canonical set (decision)

```
streetplayr | playr | letsplay | playrclub
```

This adopts the live NECTAR table's naming convention (clean slugs, no `-game`/`-club` suffix) and adds `playrclub` following the same pattern, since NECTAR's live `platforms` table has no row for PlayRClub yet at all — it needs to be seeded, not renamed.

## What this decision does NOT do yet (verified before touching anything, per STRICT RULE 7's "verify implications before applying")

- **Does not rename anything in the live `platforms` table.** `streetplayr`, `playr`, `letsplay` already match the canonical set exactly — there is nothing to rename there.
- **Does not insert a `playrclub` row into `platforms` yet.** Per the brief's Phase 6 instruction ("Build the abstraction now without pretending future sites are fully operational") and STRICT RULE 6 ("do not build future websites"), seeding a platform row for a site with no actual app, no signing secret, no `allowed_event_types` decided, and no real webhook target would be exactly that pretense. The row is trivial to add the day PlayRClub is a real target (`INSERT INTO platforms (id, name, is_active, signing_secret, allowed_event_types) VALUES ('playrclub', 'PlayRClub', false, '<generate>', '{}')` — `is_active:false` until it's genuinely live).
- **Does not touch StreetPlayR's `sites` table.** Same reasoning — one real site today, and adding rows for platforms that don't have running apps yet would be fabricating operational state.
- **Does not fix `types/ops2/ops.ts::PlatformId` in this pass.** That's UI code in `app/admin`'s ops layer, which this repair phase (NECTAR foundation + StreetPlayR bridge only, per the brief's explicit scope: "do not build the Unified Admin yet") is out of scope to touch. Flagged here as the concrete, scoped fix for whoever starts Phase 1 of the Unified Admin work: change the union to `'all' | 'streetplayr' | 'playr' | 'letsplay' | 'playrclub'` in both `types/ops2/ops.ts` (StreetPlayR) and `apps/ecosystem-ops/src/types/ops.ts` (NECTAR), and delete `siteRowToPlatform()`'s implicit assumption (StreetPlayR's `platform-store.ts`) that non-seeded platforms are permanently UI-only placeholders.

## Implications verified before finalizing this set

- **No existing FK or CHECK constraint pins the old `playr-game`/`playr-club` strings anywhere in the live schema** — those ids only ever existed in TypeScript unions and one migration file's seed data, never in a live row, so there's no data migration risk in adopting `letsplay`/`playrclub` going forward.
- **`reward_rules.eligible_tiers`, `campaigns`, and `bonus_campaigns` do not reference platform ids at all** in the live schema (verified via column introspection) — so this reconciliation has zero blast radius on reward/campaign data.
- **`allowed_event_types` per platform is already meaningfully differentiated** in the live table (`streetplayr`: purchase/review/content events; `playr`: game/membership events; `letsplay`: mission/challenge/referral events) — confirming these three platforms were deliberately, thoughtfully seeded as distinct products, not placeholder rows. `playrclub`'s eventual `allowed_event_types` should be decided when that product's actual event vocabulary is known, not guessed here.

## Summary table

| Layer | Current state | Action |
|---|---|---|
| NECTAR `platforms` (live DB) | `streetplayr, playr, letsplay, nectar-internal` — already canonical | None needed |
| StreetPlayR `sites` (live DB) | `streetplayr` only | None needed yet — add `playrclub` (and eventually `playr`, `letsplay`) rows when those apps are real |
| `types/ops2/ops.ts::PlatformId` (StreetPlayR) | `all\|streetplayr\|playr\|playr-club\|playr-game` — stale | Fix in Unified Admin Phase 1, not here |
| `apps/ecosystem-ops/src/types/ops.ts::PlatformId` (NECTAR) | Same staleness, independently | Fix alongside the above |
