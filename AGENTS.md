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

<!-- BEGIN:seamless-loop-carousels -->
# Seamless Loop Carousels

## Coverflow Wrapping
- When a 3D coverflow carousel uses visual offset calculations that jump from negative to positive at boundaries, prevent cards from sliding backward across the viewport.
- **Rule:** Compare the target coordinate translation against the current motion value. If the difference exceeds `100` (wrapping), set the motion value instantly using `baseXPct.set(...)` to snap the card. Otherwise, use `animate(...)` with spring physics for smooth sliding.

## Lookbook Infinite Scroll
- To implement seamless loop scrolling on overflow-x elements:
  - **Array Tripling:** Render three copies of the item array: `[...items, ...items, ...items]`.
  - **Unique Keys:** Key elements as `${item.id}-${index}` to keep keys unique.
  - **Scroll Event Listener:** Listen to `scroll` passive events. If `scrollLeft` goes outside the middle set range `[setWidth - clientWidth, setWidth * 2 - clientWidth]`, instantly adjust `scrollLeft` by adding/subtracting `setWidth`.
  - **ResizeObserver:** Observe the container size and run the same boundary check on resize.
  - **Autoplay & Manual Controls:** Execute normal `scrollBy` smoothly; boundary wrapping handles resetting coordinates transparently.
<!-- END:seamless-loop-carousels -->

<!-- BEGIN:ui-ux-pro-max -->
# UI/UX Pro Max — Design Intelligence (Persisted)

Saved: 2026-06-22. This block captures the /ui-ux-pro-max skill rules so they apply automatically in every session on this project.

## Skill Workflow (StreetPlayR Stack: Next.js + Tailwind)

When doing any UI/UX work, follow this order:
1. **Analyze** — product type, style, industry, stack (default: `nextjs`)
2. **Generate design system** — run `--design-system` search script
3. **Supplement** — domain searches for style/ux/typography as needed
4. **Stack guidelines** — use `--stack nextjs` for implementation specifics
5. **Deliver** — pass Pre-Delivery Checklist before submitting code

## Priority Rule Categories

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Accessibility | CRITICAL |
| 2 | Touch & Interaction | CRITICAL |
| 3 | Performance | HIGH |
| 4 | Layout & Responsive | HIGH |
| 5 | Typography & Color | MEDIUM |
| 6 | Animation | MEDIUM |
| 7 | Style Selection | MEDIUM |
| 8 | Charts & Data | LOW |

## Always Apply — Common Rules

### Icons & Visual Elements
- **No emoji icons** — use SVG icons (Heroicons, Lucide, Simple Icons)
- **Stable hover states** — color/opacity transitions only, no layout-shifting scale
- **Correct brand logos** — verified SVG from Simple Icons
- **Consistent icon sizing** — fixed viewBox (24×24) with w-6 h-6

### Interaction & Cursor
- `cursor-pointer` on ALL clickable/hoverable cards and elements
- Hover feedback: color, shadow, or border change
- Smooth transitions: `transition-colors duration-200` (150–300ms range)
- Focus states visible for keyboard navigation

### Light/Dark Mode Contrast
- Glass card light mode: `bg-white/80` or higher opacity (NOT `bg-white/10`)
- Body text light: `#0F172A` (slate-900) — NOT slate-400
- Muted text: `#475569` (slate-600) minimum
- Borders: `border-gray-200` in light mode (NOT `border-white/10`)

### Layout & Spacing
- Floating navbar: `top-4 left-4 right-4` spacing (not flush to edges)
- Always account for fixed navbar height in content padding
- Consistent container: `max-w-[min(95vw,2400px)] mx-auto` (see layout-width-system)

### Accessibility
- All images have `alt` text
- Form inputs have `<label>` elements
- Color is never the only indicator
- `prefers-reduced-motion` respected

### Performance / Animation
- Use `transform` / `opacity` — never `width`/`height` for animation
- Micro-interactions: 150–300ms
- Skeleton screens or spinners for loading states
- Check `prefers-reduced-motion` before running animations

## Pre-Delivery Checklist

Before submitting any UI code, verify:

### Visual Quality
- [ ] No emojis used as icons (SVG only)
- [ ] All icons from consistent set (Heroicons / Lucide)
- [ ] Brand logos correct (Simple Icons verified)
- [ ] Hover states don't cause layout shift
- [ ] Theme colors used directly (`bg-primary`), not `var()` wrappers

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions: 150–300ms
- [ ] Focus states visible for keyboard nav

### Light/Dark Mode
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Both modes tested before delivery

### Layout
- [ ] Floating elements spaced from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px / 768px / 1024px / 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected

## StreetPlayR Design Context (Session: 2026-06-22)

- **Stack:** Next.js 15 App Router + Tailwind CSS
- **Aesthetic:** Dark editorial streetwear — minimal, bold typography, high contrast
- **Container rule:** `max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6` (see layout-width-system)
- **Animation library:** Framer Motion
- **Backend:** Supabase
- **Scroll:** Custom frame-rate-independent damping (see web3d-scroll-damping)
<!-- END:ui-ux-pro-max -->
