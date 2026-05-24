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
