# Streetplayr Codebase Memory & Guidelines

## Core System
- **Framework:** Next.js 16 (App Router + Turbopack)
- **Styling:** Tailwind CSS (v4)
- **Database/Auth:** Supabase (PostgreSQL + RLS)
- **3D Render Library:** React Three Fiber (R3F) + Three.js

---

## Commands

### Development Server
Run from [streetplayr-web](file:///e:/SP%20-%20Copy/streetplayr-web):
```bash
npm run dev
```
*Note: Default port is `3000`. If port 3000 is occupied, it will automatically select `3001`.*

### Build & Lint
```bash
npm run build
```
```bash
npm run lint
```
```bash
npx tsc --noEmit
```

### Git Commands (Pushing to GitHub)
Must be run from the repository folder [streetplayr-web](file:///e:/SP%20-%20Copy/streetplayr-web):
```powershell
# Navigate to repository root
cd "E:\SP - Copy\streetplayr-web"

# Stage modified files
git add <files>

# Commit changes
git commit -m "<commit-message>"

# Push to GitHub
git push origin main
```

---

## Environment Variables
The following variables are required in `.env` (or `.env.local`) for Supabase features:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-side only)
- *Note: In development mode, mock data is returned if these variables are missing.*

---

## Key 3D Files & Models

### 3D Component
- [NinjaStar.tsx](file:///e:/SP%20-%20Copy/streetplayr-web/components/ui/NinjaStar.tsx) — Main React Three Fiber component rendering the ninja star.

### GLB Model Paths
- [3-d Star.glb](file:///e:/SP%20-%20Copy/streetplayr-web/public/models/3-d%20Star.glb)
- [inspired.glb](file:///e:/SP%20-%20Copy/streetplayr-web/public/models/inspired.glb)
- [starchrome.glb](file:///e:/SP%20-%20Copy/streetplayr-web/public/models/streetplayr-star/starchrome.glb)
- [star_Purple.glb](file:///e:/SP%20-%20Copy/streetplayr-web/public/models/streetplayr-star/star_Purple.glb)

---

## Architecture Quick Ref
- [app/admin/](file:///e:/SP%20-%20Copy/streetplayr-web/app/admin/) — Super-admin panel routes.
- [app/(store)/](file:///e:/SP%20-%20Copy/streetplayr-web/app/(store)/) — Public storefront routes.
- [components/sections/home/Lookbook.tsx](file:///e:/SP%20-%20Copy/streetplayr-web/components/sections/home/Lookbook.tsx) — Auto-playing lookbook carousel displaying 10 looks with product redirects.
- [components/page-editor/](file:///e:/SP%20-%20Copy/streetplayr-web/components/page-editor/) — Block renderer components for the CMS.
- [stores/ops2/platform-store.ts](file:///e:/SP%20-%20Copy/streetplayr-web/stores/ops2/platform-store.ts) — Zustand platform/site switcher state.

---

## Gotchas & Troubleshooting

### WebGL Context Loss in Headless Browsers
When performing automated visual testing (e.g. taking screenshots via devtools or headless browser engines), Puppeteer/Chrome can throw context-loss warnings after multiple reloads.
- **Fix:** Launch a fresh browser page/tab instead of refreshing the existing tab to reset the GPU process and clear the blocked WebGL context.

### Pointer Events Suppression in Overlay Wrappers
If an interactive component (e.g., arrow buttons in [PremiumCoverflowCarousel.tsx](file:///e:/SP%20-%20Copy/streetplayr-web/components/ui/PremiumCoverflowCarousel.tsx)) is wrapped inside an absolute container with `pointer-events-none`, the child interactive elements will inherit `pointer-events: none` and be unclickable.
- **Fix:** Explicitly set `pointerEvents: "auto"` (or the `pointer-events-auto` class) on the child elements to restore cursor change, hover states, and click/tap capabilities.

### Custom Cursor Suppression
If storefront layout wrappers globally disable default cursors (e.g. using `cursor: none !important`), standard browser pointer interactions and hovers become invisible.
- **Fix:** Remove the `<CustomCursor />` rendering and delete the `<style>` block forcing `cursor: none !important` from all storefront layout files (e.g., `app/(store)/*/layout.tsx`).

### Carousel / Lookbook Navigation Clickability & Autoplay Pausing
If a lookbook/carousel has card overlays (such as hover CTA screens at `z-30`), the navigation arrows can be blocked or unclickable if their z-index is too low.
- **Fix:** Keep arrow buttons at `z-40` or higher to sit above hover overlays.
- **Click Target Sizing:** Add an invisible expanded click target around circular buttons using Tailwind's pseudo-elements (e.g., `after:content-[''] after:absolute after:-inset-4`) to ensure they are easily clickable without altering visual button size.
- **Autoplay Interaction:** Stop auto-scroll intervals when a user hovers over the navigation buttons by binding `onMouseEnter` / `onMouseLeave` to the buttons as well as the carousel viewport.
- **Infinite Wrapping:** Keep navigation arrows visible (`flex` instead of `hidden`) when content overflows, and wrap the scroll positions (infinite loop navigation) at the boundaries so users can continuously navigate in both directions.

### 3D Star Layout, Reactivity, & Interactive Scaling
The `NinjaStar` 3D component is designed to be interactive but has scroll-driven transformations by default (parallax depth translation and rotation based on page scroll).
- **Reactivity Gating:** For static, non-scrolling layouts (e.g. footers, popup modals, or static intro screens), disable scroll-driven reactivity by passing `scrollReactive={false}` to `<NinjaStar />`. This allows the star to auto-spin on its fixed Y-axis and retain its base position.
- **Interactivity:** Ensure the parent container of the star has `pointer-events-auto select-none` classes so pointer/touch drags can rotate the star in 3D.
- **Grid Alignment & Responsiveness:** Wrap the `<NinjaStar />` inside a responsive, aspect-square container with progressive max-widths (e.g. `w-full max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[240px]` in footer, or `w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px]` in popup modal).
- **Dynamic Scale Adjustments:** Since the 3D model tips can clip the camera's view frustum if the scale is too high relative to the container width, calculate the `scale` prop dynamically based on viewport width (e.g., `0.75`/`0.95`/`1.15` in footer, or `1.05`/`1.25`/`1.45` in popup modal) to ensure a snug fit on all devices.
- **Height-Based Viewport Overflow Prevention:** On full-screen fixed landing or splash pages (e.g., `/enter-the-play`), elements like the 3D star canvas, logo brand image, and gaps must scale using viewport height (`vh`) rather than fixed width/pixels to prevent vertical clipping at 100% zoom on desktop. Use CSS `clamp()` and `max-height` (e.g. `max-height: clamp(60px, 12vh, 100px)` for logos, and `width`/`height` with `vh` values for the 3D container) to keep all elements within the fold.

### Supabase Stub Awaitable/Thenable Gotcha
- **Problem:** If a proxy-based mock/stub client implements a custom `.then()` method (or returns another proxy on property access), JS and React rendering environments may assume it's a Promise/thenable object and attempt to await it. This leads to infinite loops, compiler crashes, or hanging SSR/actions.
- **Fix:** In `lib/supabase/stub.ts`, explicitly check for `then`, `catch`, or `finally` on the top-level returned client and return `undefined` so that it is not considered thenable.

### Premium Contact Page & Terminal Log Success State
- **Route:** `/contact` is mapped to the storefront Contact Us page.
- **Submission:** Implemented via Next.js Server Action (`submitContactAction`).
- **Cyberpunk UI Success State:** Upon successful form submission, the UI shifts from the inputs to an interactive CLI/terminal simulator which logs server communication events, mock headers, and transmission payloads before letting the user send another message. Mocks/stubs allow this to work offline or in development without failing.

### Reviews & Testimonials Mobile Slider Layout
To prevent horizontal overflow and clutter on mobile screens in review/testimonial components:
- **State-driven slider:** Avoid simple scrollable snap rows (`overflow-x-auto`) which cause partial cards to leak or overflow layouts. Use a state-driven sliding approach with React `useState` tracking the active card index.
- **Single-card viewport:** On mobile screens (`max-md`), display exactly one card at a time. Keep other cards hidden dynamically.
- **Controls & Indicators:** Implement active-index controls consisting of prev/next arrow buttons (with wrapping boundary handling) and dot indicators (active dot styled differently, e.g., pill shape, inactive dots as standard circles). All dots should be interactive and map to their respective cards.
- **Desktop Grid Fallback:** Render the desktop version separately (e.g., using a 3-column grid) gated via responsive utility classes (`hidden md:grid` on desktop, `md:hidden` on the mobile slider container).

### Sandbox Git Push & Authentication Issues
When pushing local commits to GitHub from the Antigravity sandbox:
- **Dummy GITHUB_TOKEN Override:** The sandbox automatically injects a dummy `GITHUB_TOKEN` environment variable. This overrides the local keyring credentials (e.g. for `QalaLabs`), causing `fatal: Authentication failed` when executing standard `git push` commands.
- **Fix:** Clear the environment variable in the terminal session prior to pushing, configure GitHub CLI credentials, and execute the push:
  ```powershell
  # For PowerShell (Windows)
  Remove-Item env:GITHUB_TOKEN
  gh auth setup-git
  git push origin main
  ```
  ```bash
  # For Bash/Linux/Mac
  unset GITHUB_TOKEN
  gh auth setup-git
  git push origin main
  ```

### Root Route Redirects Externally — Don't Link to "/"
`app/(store)/page.tsx` (`/`) now does a hard `redirect()` to `https://streetplayr.qalalabs.com/entering-street-playR` (the `/enter-the-play` splash page was removed). Any internal `<Link href="/">` left pointing at the old root will get repeatedly prefetched by Next.js and hammer that external redirect — in one session this hung a headless browser tab in an infinite `HEAD /` loop.
- **Fix:** Point all internal "home" links (mobile bottom nav, PDP breadcrumb, checkout-success "return" link, header logo, etc.) at `/home`, never `/`.

### `.storefront-root` Reset Used to Silently Zero Out Tailwind Padding/Margin Utilities
`styles/storefront.css` loads *after* Tailwind's compiled stylesheet (globals.css is imported in the root `app/layout.tsx`; storefront.css is imported in the nested `app/(store)/layout.tsx`, which renders later in the cascade). The original reset rule `.storefront-root * { box-sizing: border-box; margin: 0; padding: 0; }` had the same specificity as any Tailwind utility class (`py-28`, `p-4`, `mt-14`, etc.) — on a cascade tie, the later stylesheet wins, so this rule silently overrode every Tailwind spacing utility applied to a `div`/`span`/`section`/`a` anywhere inside `.storefront-root`. Confirmed live: a bare `p-4` div injected inside `.storefront-root` computed to `padding: 0px`. This caused real, hard-to-spot text overlap bugs on multiple pages (e.g. the About page's Founder and Collection sections rendering flush into each other because `py-28`/`py-32` resolved to 0).
- **Fix applied:** scoped the margin/padding reset to only the native elements that actually carry non-zero browser-default spacing (`h1`-`h6`, `p`, `ul`, `ol`, `li`, `figure`, `blockquote`, `dl`, `dd`, `fieldset`, `button`, `input`, `select`, `textarea`) — `div`/`span`/`section`/`a`/etc. never had non-zero UA defaults to reset in the first place, so excluding them from the reset is a no-op except that it lets Tailwind's own `p-*`/`m-*` utilities work again. `box-sizing: border-box` stays universal on `.storefront-root *`.
- **If new mystery zero-spacing bugs appear:** check whether the element relies on a bare Tailwind spacing utility with no matching bespoke CSS class — that's the failure mode this reset used to cause everywhere.
- **Gotcha while editing this rule:** a CSS block comment containing the literal substring `*/` anywhere in its text (e.g. writing `p-*/m-*` shorthand) closes the comment early and corrupts everything after it into real CSS, eventually surfacing as a confusing "Unclosed string" PostCSS error many lines later. Validate with `node -e "require('postcss').parse(require('fs').readFileSync('styles/storefront.css','utf8'))"` before trusting a comment-heavy edit to this file.

### Global Background Particles & Stacking Context Visibility
To keep the global floating particles animation (`GlobalParticles` at `z-[-1]`) visible behind all text, images, videos, and products across the storefront:
- **Layering Hierarchy:** The background layers are structured as: Body background gradient (`z-[-3]`) -> page-specific background overlays (`z-[-2]`) -> `GlobalParticles` (`z-[-1]`) -> content (`z-auto`/`0`/positive).
- **Avoiding Isolated Stacking Contexts:** Store layout/template wrappers (e.g., `app/(store)/template.tsx` and section headers like `HomeHero.tsx`) must avoid isolating content layout (do not use `isolate` or wrapper classes like `z-[2]`), as doing so groups the page background and text together above the global particles layer.
- **Targeting Fixed Background Overlays:** Any page-specific fixed background overlays that lack explicit z-indexes are forced to the correct layer in `app/globals.css` using the selector `.pointer-events-none.fixed.inset-0:not([class*="z-"]):not(.exempt-motion) { z-index: -2 !important; }`.
- **Scoping Opaque Portal Backgrounds:** Dashboard/portal CSS (e.g., `app/nectar-portal.css`) that sets a solid background on the `body` must be scoped to a container class (e.g., `.nectar-portal-root` applied in `app/dashboard/layout.tsx`) to prevent it from globally rendering over and hiding the storefront's transparent page backgrounds and floating particles.

### HomeHero Banner — Vibrancy Tuning (Session: 2026-07-08)
The hero banner background image appeared washed out / heavily tinted. Fixed in [HomeHero.tsx](file:///e:/SP%20-%20Copy/streetplayr-web/components/sections/home/HomeHero.tsx):
- **`overlayOpacity` default:** Reduced from `0.4` → `0.15` (the darkness multiplier applied to the base overlay div).
- **Linear gradient overlay:** Top anchor `0.15`, mid-point `0.05` at 40%, bottom-fade `0.85` at 100% (preserves blending into the next section while keeping the image bright).
- **Radial vignette:** Central transparent zone expanded to 50%; edge opacity reduced from `0.72` → `0.40`.
- **Noise overlay opacity:** Container opacity dropped from `45%` → `15%` to remove the grey haze film over the image.
- **Build verified:** Deleted `.next` cache, ran `npm run build` (zero TypeScript errors), restarted `npm run dev`.

### HomeHero Banner — Model Cropping vs. Letterbox Tradeoff (Session: 2026-07-08)
- **Fix applied:** Changed both banner `<img>` tags in [HomeHero.tsx](file:///e:/SP%20-%20Copy/streetplayr-web/components/sections/home/HomeHero.tsx) (desktop `main-web-banner-st.jpg` and mobile `st-banner-mobile.jpg`, 842×842) from `object-cover` to `object-contain`, so all models are always fully visible.
- **Known tradeoff:** `object-contain` prevents cropping but leaves a letterboxed margin top/bottom (visible against the dark backdrop) since the image is wider than the viewport — there is no way to get zero-crop and zero-margin simultaneously with the image at its current pixel dimensions.
- **Proper long-term fix (not yet applied):** Extend the banner's canvas vertically (outpaint matching studio backdrop above/below the photo) to bring its aspect ratio closer to typical screens (~1.9:1), then switch back to `object-cover` so it fills edge-to-edge while cropping only into the added background, never into a model.

### HomeHero Banner — Outpaint Specifications (Session: 2026-07-08)
- **Desktop banner target:** `1920×1080` px (1.78:1 Full HD ratio, up from current 1920×720)
  - **Outpaint instruction:** Extend studio backdrop vertically by +180px top and +180px bottom (+360px total height), matching existing lighting, color gradient (purple to dark), and particle density. Keep all 8 models fully visible and centered in frame.
  - **Reasoning:** 1080p matches standard Full HD viewport ratio; vertical extension only affects backdrop area above/below models, never cropping them when using `object-cover`.
- **Mobile banner:** Keep current `842×842` (1:1 square) or reframe to `375×812` (standard mobile portrait 0.46:1 ratio) depending on design preference.
- **Implementation:** Once new banners received:
  1. Replace `/public/assets/main-web-banner-st.jpg` (desktop) with outpainted 1920×1080 version.
  2. Update `HomeHero.tsx` image tags to switch back from `object-contain` → `object-cover`.
  3. Verify zero model cropping across desktop/tablet/mobile breakpoints.

### Banner Updates, Lightbox & Mobile Gallery Scroll (Session: 2026-07-09)
- **PDP Zoom & Lightbox**: Main and secondary product images open a spring-animated modal overlay (`lightboxIndex`) with close button, next/prev arrow hotkeys, and slide counter. Uses custom styles with cursor-zoom-out inside the lightbox.
- **PDP Mobile Snap Scrolling**: Mobile Embla carousel slides resized from `flex: "0 0 65%"` to `flex: "0 0 100%"` with padding offsets so that swipes snap exactly 1 image at a time.
- **Home Banner Replacement**:
  - Replaced default banners with `/assets/empty_centre.jpg` and removed old asset files (`main-web-banner-st.jpg`, `st-banner-mobile.jpg`).
  - Reduced 3D star scale factors (`0.70` desktop, `0.60` tablet, `0.45` mobile) but preserved original centered layout (no translate-y offset).
  - Pushed bottom CTA buttons up by changing content padding from `pb-16` to `pb-32` to avoid overlapping the scroll down indicator.
- **Collections Page Motion Banners**:
  - Replaced static hero banners with loop autoplaying `<video>` tags: `COLLECTION_MOTION_BANNER.mp4` on desktop (`hidden md:block`) and `FOR_MOBILE_ST_COLLECTION.mp4` on mobile (`md:hidden`).
  - Removed title heading ("Current Release") and all background gradient overlay layers from the banner section.
  - Configured video tags with `opacity-100` and removed saturation filter caps to render raw, unblended colors.

---

## Bluorng UI & Design System Migration Guidelines

### 1. Style & Theme Isolation
- All new Bluorng UI styling variables, color tokens, and utility classes are scoped under the `.storefront-root` container class in [storefront.css](file:///E:/SP%20-%20Copy/streetplayr-web/styles/storefront.css).
- Theme toggler switches between default and dark themes by toggling the `.theme-dark` class on the `.storefront-root` and `body` elements.
- The global layout wrappers in [app/(store)/layout.tsx](file:///E:/SP%20-%20Copy/streetplayr-web/app/%28store%29/layout.tsx) wrap children inside `<div className="storefront-root">` to load these styles securely.

### 2. Cart Context & State Wrapping
- To bridge the mockup design (which uses local `CartContext` hooks) with the live project's Zustand state manager, use the adapter hooks from [CartContext.tsx](file:///E:/SP%20-%20Copy/streetplayr-web/components/CartContext.tsx).
- Call `useCart()` inside client components to query cart items, total count, total price, drawer open/close triggers, and to show toast messages.

### 3. Unified Product Card Component
- A unified product card component is defined at [ProductCard.tsx](file:///E:/SP%20-%20Copy/streetplayr-web/components/ui/ProductCard.tsx).
- It handles both database-fetched products (Supabase query outputs) and local fallback products (`LOCAL_PRODUCTS`).
- Integrates hover image cycling, wishlist saving, cart insertion, sold-out badges, and sale banners.

### 4. Dynamic Page Tints
- The product detail page uses the `pageTint(title)` helper to calculate a soft colorway-specific background color derived from the product's title.
- Scoped inside the page wrapper container: `<div className="pdp-page" style={{ background: pageTint(product.name) }}>`.

### 5. Supabase Database & Local Fallbacks
- Page routes and queries automatically detect whether Supabase environment variables are configured.
- When `NEXT_PUBLIC_SUPABASE_URL` is missing or is set to a mock project, the query layers in [queries.ts](file:///E:/SP%20-%20Copy/streetplayr-web/lib/products/queries.ts) automatically fall back to loading data from [data.ts](file:///E:/SP%20-%20Copy/streetplayr-web/lib/products/data.ts) without throwing network errors or breaking storefront render.

### 6. Easebuzz Payment Gateway Integration
- **Primary Gateway**: Easebuzz selected for both domestic (INR/UPI/NetBanking) and international payment processing.
- **Server Action**: [app/actions/easebuzz.ts](file:///e:/SP%20-%20Copy/streetplayr-web/app/actions/easebuzz.ts) initiates payment session with SHA-512 payload hash.
- **Webhook Callback**: [app/api/webhooks/easebuzz/route.ts](file:///e:/SP%20-%20Copy/streetplayr-web/app/api/webhooks/easebuzz/route.ts) handles SURL/FURL callbacks with reverse hash verification to update order status (`paid` / `cancelled`) and fulfill inventory reservations (`inventory_reservations`).

### 7. Database Migration 00016 Consolidation
- **Consolidation Migration**: [00016_ecommerce_production_fix.sql](file:///e:/SP%20-%20Copy/streetplayr-web/supabase/migrations/00016_ecommerce_production_fix.sql) consolidates production schema requirements:
  - Adds `sprr_balance`, `referral_code`, and `tier` columns to `profiles`.
  - Creates `wallet_transactions`, `collections`, `collection_products`, and `operational_events` tables with Row Level Security (RLS) policies.

---

### Desktop UI, Navigation & Preloader Updates (Session: 2026-07-22)
- **Preloader & Video Playback**: Direct load into preloader video (`WebAnimation_V1.mp4`) without pre-video click gates. Relabeled video preloader skip button to `[ CLICK TO ENTER ]` in [`app/entering-street-playR/page.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/app/entering-street-playR/page.tsx).
- **Navigation & Top Bar**:
  - Removed top-left "Shop" button, keeping `Collection` link in top-left navigation.
  - Reorganized `Collection` dropdown in [`components/layout/Navbar.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/components/layout/Navbar.tsx) under **Topwear** (Short Sleeve T-Shirts, Long Sleeve T-Shirts, Tanks) and **Bottomwear** (Sweatpants, Pants & Cargo).
  - Moved **Shop & Support** (FAQ, Collaborations, Shipping Policy, Refund Policy, Contact) into the top-right hamburger menu drawer (`{Icon.menu}`).
  - Confirmed logo link redirects directly to `/home`.
- **Homepage CTA & Rebranding**:
  - Enlarged "Shop Now" button styling in [`styles/storefront.css`](file:///e:/SP%20-%20Copy/streetplayr-web/styles/storefront.css).
  - Updated section titles in [`app/(store)/home/page.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/app/%28store%29/home/page.tsx) to `Short Sleeve T-Shirts`, `Long Sleeve T-Shirts`, `Tanks`, and `Sweatpants`.
- **Page Visibility & Formatting**:
  - Hidden "Our Story" link in [`components/layout/Footer.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/components/layout/Footer.tsx).
  - Formatted [`app/(store)/faq/page.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/app/%28store%29/faq/page.tsx) and [`app/(store)/collaborations/page.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/app/%28store%29/collaborations/page.tsx) with the unified legal/policy shell (`legal-page`/`legal-shell`).
- **Checkout Dark Mode & Scroll Responsiveness**:
  - Added explicit dark background and text color rules for `<select id="country">` and `<option>` elements in dark mode.
  - Re-tuned wheel scroll parameters in [`components/ui/ScrollDamping.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/components/ui/ScrollDamping.tsx) (increased spring stiffness to `0.018` and removed `0.7` speed penalty) to eliminate scroll delay.
- **Domain Redirect**: Fixed root route redirect in [`app/(store)/page.tsx`](file:///e:/SP%20-%20Copy/streetplayr-web/app/%28store%29/page.tsx) to route internally to `/entering-street-playR` instead of external `streetplayr.qalalabs.com`.



