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

