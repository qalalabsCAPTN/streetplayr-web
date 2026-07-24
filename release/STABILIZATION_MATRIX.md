# StreetPlayR Release Stabilization Matrix

Source of truth: `C:\Users\pc\Downloads\streetplayR feedback.docx` (May 22–23, 2026)
Plus: later verbal/session asks (glass header, location icon, PR order from PO)

Status: NOT STARTED | IN PROGRESS | BLOCKED | DONE | PARTIALLY DONE | CONFLICT

---

## Source notes

- Doc final line: **Version 3 finalised** by Aaryan Shenoy / nitin / creative.
- May 22 header layout (logo left / menu centre) may be **superseded by Version 3** (current centre-logo BluOrng pattern). Treat as CONFLICT until PO confirms.
- Doc ≠ 100+ discrete tickets. Expanded PR scope comes from later sessions + your PR-1…PR-7 order.

---

## PR-1 — Header / Navigation / Glass / Mobile / Logo / Search / Location

| ID | Item | Source | Status | Evidence / Notes |
|----|------|--------|--------|------------------|
| P1-01 | Logo extreme left | May 22 Header | CONFLICT | Current: logo centre (`Navbar.tsx` + `.header__inner` 1fr auto 1fr). Jul 22 + Version 3 pattern. |
| P1-02 | Menu options centre aligned | May 22 Header | CONFLICT | Current: Collection left column. |
| P1-03 | Cart extreme right | May 22 Header | PARTIALLY DONE | Bag right; crowded by theme/stories/account/wishlist/menu. |
| P1-04 | Checkout extreme right | May 22 Header | NOT STARTED | Checkout only inside `CartDrawer`. |
| P1-05 | Remove Live / Drop 01 from header | May 22 Header | DONE | Header clean. Residual copy in `NewDrops.tsx` → PR-2. |
| P1-06 | Phone: keep logo fixed | May 22 Header | PARTIALLY DONE | Fixed header; mobile logo leftish in pill. |
| P1-07 | Glassmorphism header | Verbal (Jul 24) | DONE | `storefront.css` `.header` backdrop-filter frosted bar. |
| P1-08 | Mobile nav / hamburger | Architecture | PARTIALLY DONE | Desktop hamburger = Shop&Support. Mobile = `+` + bottom `MobileNav`. Orphan `MobileNavDock.tsx`. |
| P1-09 | Logo → `/home` | Architecture | DONE | `Navbar.tsx` + `MobileNav.tsx`. |
| P1-10 | Search icon in header | Verbal / PR order | PARTIALLY DONE | Desktop header yes; mobile header no (bottom nav yes). |
| P1-11 | Location icon in header | Verbal / PR order | NOT STARTED | No pin icon. `/stores` = ComingSoon. Footer has Walk-in Stores. |

**PR-1 code start: BLOCKED on conflict decisions below.**

---

## PR-2 — Homepage / Banners / Categories / Archive / Star / Collection removal

| ID | Item | Source | Status |
|----|------|--------|--------|
| P2-01 | Boxes curved (bluorng) | May 22 General | NOT STARTED (scoped later) |
| P2-02 | Reduce padding/margin bluorng | May 22 General | NOT STARTED |
| P2-03 | Utilise bigger LCD 16"+ | May 22 General | PARTIALLY DONE (max-w 2400) |
| P2-04 | Preloader `[ Click to Enter ]` brackets | May 22 Preloader | DONE (per CLAUDE Jul 22) |
| P2-05 | Star size/width | May 22 Preloader | PARTIALLY DONE |
| P2-06 | Remove frame 2 text create things | May 22 Home | AUDIT NEEDED |
| P2-07 | Best Sellers 1×4 + hover + image fill | May 22 Best Sellers | AUDIT NEEDED |
| P2-08 | Vision margins / video / Brand Story CTA | May 22 Vision | AUDIT NEEDED |
| P2-09 | Lookbook slider / curve / hover redirect | May 22 Look Book | AUDIT NEEDED |
| P2-10 | Testimonial hidden / boxy / padding | May 22 | AUDIT NEEDED |
| P2-11 | Highlight price / New Arrival Desktop 2 | May 23 | AUDIT NEEDED |
| P2-12 | Mobile: banner text clash, dynamic link | May 23 Mobile 3 | AUDIT NEEDED |
| P2-13 | New Arrival carousel image-based | May 23 Mobile 3 | AUDIT NEEDED |
| P2-14 | Shop by category slider | May 23 Mobile 3 | AUDIT NEEDED |
| P2-15 | Exclusive Drop stand out | May 23 Mobile 3 | AUDIT NEEDED |
| P2-16 | Archive / Star / Collection removal | PR order verbal | AUDIT NEEDED |

---

## PR-3 — PDP

| ID | Item | Source | Status |
|----|------|--------|--------|
| P3-01 | Images like bluorng | May 22 PDP | AUDIT NEEDED |
| P3-02 | Grey text bold | May 22 PDP | AUDIT NEEDED |
| P3-03 | Boldfit/Adidas reference | May 23 | AUDIT NEEDED |
| P3-04 | Favorite on PDP | May 23 Desktop 4 | AUDIT NEEDED |
| P3-05 | Size selector / spacing / CTA | PR order | AUDIT NEEDED |
| P3-06 | Ravi approve PDP design | May 23 Action | BLOCKED (client) |

---

## PR-4 — Search / Wishlist / Login / Dashboard / 3D Carousel / Lazy Scroll

| ID | Item | Source | Status |
|----|------|--------|--------|
| P4-01 | Login: remove brackets member access / fields | May 22 Login | AUDIT NEEDED |
| P4-02 | Login text bold | May 22 | AUDIT NEEDED |
| P4-03 | Profile wallet button color | May 22 Profile | AUDIT NEEDED |
| P4-04 | Remove Quick Actions | May 22 Profile | AUDIT NEEDED |
| P4-05 | Save Nodes → Saved Addresses | May 22 Profile | AUDIT NEEDED |
| P4-06 | Search / Wishlist polish | PR order | AUDIT NEEDED |
| P4-07 | 3D Carousel / Lazy Scroll | PR order | AUDIT NEEDED |

---

## PR-5 — Footer / FAQ / Collaboration / Walk-in / Social

| ID | Item | Source | Status |
|----|------|--------|--------|
| P5-01 | One logo / bluorng footer | May 22 Footer | AUDIT NEEDED |
| P5-02 | Phone: remove second logo | May 22 Footer | AUDIT NEEDED |
| P5-03 | Mobile footer sticky + opaque | May 23 Mobile 4 | AUDIT NEEDED |
| P5-04 | FAQ / Collaboration polish | PR order / Jul 22 | PARTIALLY DONE |
| P5-05 | Walk-in Stores | PR order | PARTIALLY DONE (`/stores` ComingSoon) |
| P5-06 | Social links | PR order | AUDIT NEEDED |

---

## PR-6 — Mobile Polish

| ID | Item | Source | Status |
|----|------|--------|--------|
| P6-01 | Loading video full 9:16 | May 22 Phone | AUDIT NEEDED |
| P6-02 | Restart carousel glitch | May 22 Phone | AUDIT NEEDED |
| P6-03 | Collection thumb → second image | May 22 Collection | AUDIT NEEDED |
| P6-04 | Cart linear scroll reduce | May 22 Cart | AUDIT NEEDED |
| P6-05 | Story / Filters / Banner / Search / Footer | PR order | AUDIT NEEDED |

---

## PR-7 — Final Regression / Build / Lighthouse / Handover

| ID | Item | Status |
|----|------|--------|
| P7-01 | Production build | NOT STARTED |
| P7-02 | Lighthouse | NOT STARTED |
| P7-03 | Full regression matrix | NOT STARTED |
| P7-04 | Client handover pack | NOT STARTED |

---

## Cross-cutting (assign later)

| ID | Item | Source | Status |
|----|------|--------|--------|
| X-01 | Cart minimalistic | May 22 | → PR-6 or cart PR |
| X-02 | Checkout remove brackets / bold text | May 22 | → checkout slice |
| X-03 | Checkout placeholder grey | May 23 | → checkout slice |
| X-04 | Contact form pane dark grey | May 23 | → contact slice |
| X-05 | About journey horizontal+linear | May 22 | BLOCKED (Reyansh ref) |
| X-06 | About no green | May 23 | AUDIT NEEDED |
| X-07 | News pagination newest top | May 23 | AUDIT NEEDED |
| X-08 | Collection cleaner / price box | May 23 | → collections slice |
| X-09 | B2B page | May 23 | BLOCKED (Nitin confirm) |
| X-10 | Banner button + dynamic link | May 23 | BLOCKED (CTO confirm) |

---

## Blocked (client)

1. P3-06 — Ravi PDP design approval
2. X-05 — Reyansh journey reference
3. X-09 — B2B hold / Nitin
4. X-10 — Banner CTA mode / CTO
5. **P1-01 / P1-02** — layout conflict vs Version 3 (await PO)

---

## PR-1 conflict decisions required

Reply with A/B/C for each:

### C1 — Desktop header layout
- **A)** Keep Version 3: logo centre, Collection left (current)
- **B)** Apply May 22 literally: logo extreme left, menu centre, icons right
- **C)** Hybrid: logo left, Collection still left-of-centre cluster, icons right

### C2 — Checkout in header
- **A)** No separate checkout icon (bag → drawer → checkout) — current
- **B)** Add checkout icon/link next to bag → `/checkout`

### C3 — Location icon
- **A)** Add pin → `/stores` even while ComingSoon
- **B)** Defer to PR-5 Walk-in Stores (page first, then icon)
- **C)** Skip icon entirely

### C4 — Mobile search in header bar
- **A)** Keep search only in bottom nav (current)
- **B)** Also show search icon in mobile header

### C5 — Orphan `MobileNavDock.tsx`
- **A)** Delete in PR-1
- **B)** Leave unused until PR-6
