<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:layout-width-system -->
# Container Width System

## Universal Rule
Replace all fixed max-width containers with:
```
max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6
```

- Below 2400px: width = 95vw (~92% of screen)
- Above 2400px: hard cap at 2400px (ultrawide safety)
- No lg:px-XX needed — let max-w do the work
- `px-4` (mobile) NEVER changed

## Two Patterns

**Pattern A** — constraint ON the `<section>` tag:
```
FIND:    className="... px-4 md:px-8 lg:px-16 max-w-[ANYTHING] mx-auto"
REPLACE: className="... px-4 md:px-6 w-full max-w-[min(95vw,2400px)] mx-auto"
```

**Pattern B** — full-bleed `<section>` with constrained inner `<div>`:
```
section:     remove lg:px-XX → keep only px-4 md:px-6
inner <div>: max-w-[ANYTHING] → max-w-[min(95vw,2400px)]
```

## DO NOT TOUCH
- `max-w-md` / `max-w-sm` / `max-w-[460px]` inside card content (line-length limiters)
- HomeHero (already full-bleed)
- CategoryScroll (already full-bleed marquee)
- Any mobile padding (`px-4`)
- Checkout / Profile pages (separate approval)

## Pages Updated (Homepage — done)
- BestSellers, BrandStory, CollectionTiles, NewDrops
- ReviewsSection, FeaturedCollections, SocialProof, Lookbook

## Pages Updated (Done)
- Homepage sections: BestSellers, BrandStory, CollectionTiles, NewDrops, ReviewsSection, FeaturedCollections, SocialProof, Lookbook
- **Collections** — CategoryFilter, CollectionHero, EditorialFeed, collections/page.tsx
- **PDP** — ProductDetailClient, ProductReviews, ProductDetails, RecommendedProducts, EditorialLooks, MacroDetails
- **About** — Hero, Journey, Manifesto, FounderCard, MaterialSpecs, QuoteSection, FooterTransition

## Not Yet Touched
- Checkout, Cart, Profile pages (separate approval)
- Auth pages
- Admin pages
- Footer (w-full, no max-w needed)
<!-- END:layout-width-system -->

<!-- BEGIN:web3d-scroll-damping -->
# Web3D Scroll Damping & Touch Optimization

## Universal Rules

### 1. Frame-Rate Independent Scroll Damping
When implementing custom scroll damping:
- **Always** use a fixed-timestep sub-stepping accumulator (e.g., 2ms/500Hz step size) rather than per-frame physics updates.
- This ensures the scroll feel (inertia, deceleration, softness) behaves identically across standard (60Hz) and high-refresh-rate (120Hz, 144Hz, 240Hz) displays.
- Suggested constants for a 2ms step: `stepStiffness = 0.004`, `stepDamping = 0.98`.

### 2. Route Transition Resets
- **Always** listen to route changes (e.g., `usePathname` in Next.js) and immediately reset/synchronize the damping variables to `window.scrollY`.
- This prevents visual scroll-back/jump artifacts when navigating.

### 3. Touch Scroll Trap Prevention over 3D Canvas
- **Never** leave `touch-action: none` on interactive 3D WebGL Canvas wrappers or Canvas elements.
- **Always** set `touch-action: pan-y` (or `pan-y pinch-zoom`) so that touch devices (like mobile phones) can scroll the page vertically when dragging over the 3D canvas, avoiding user touch trapping.

### 4. Scroll-Driven 3D Reactivity & Parallax
- To animate 3D elements in response to page scrolling:
  - Wrap the 3D body inside a dedicated scroll-reactive group (`scrollRef`).
  - Keep this separate from any auto-rotation or drag-rotation physics groups (`groupRef`) so they combine additively.
  - Linearly interpolate (`lerp`) the scroll position to update rotation, tilt, and Z-depth position changes.
<!-- END:web3d-scroll-damping -->

