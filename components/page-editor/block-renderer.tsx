'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import { cn } from '@/lib/ops2/cn';
import ProductCarouselComponent from '@/components/ui/ProductCarousel';
import type { PageBlock } from '@/lib/page-editor/get-page-blocks';
import Image from 'next/image';

import dynamic from 'next/dynamic';

const CMSHeroWrapper = dynamic(() => import('./wrappers/CMSHeroWrapper'), { ssr: true });
const CMSBestSellerWrapper = dynamic(() => import('./wrappers/CMSBestSellerWrapper'), { ssr: true });
const CMSBrandStoryWrapper = dynamic(() => import('./wrappers/CMSBrandStoryWrapper'), { ssr: true });
const CMSLookbookWrapper = dynamic(() => import('./wrappers/CMSLookbookWrapper'), { ssr: true });
const CMSReviewsWrapper = dynamic(() => import('./wrappers/CMSReviewsWrapper'), { ssr: true });


// ============================================================
// BlockRenderer — renders a list of PageBlocks from the DB.
// Add new block types here as the editor grows.
// ============================================================

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  if (!blocks.length) return null;

  return (
    <>
      {blocks.map((block) => (
        <BlockSwitch key={block.id} block={block} />
      ))}
    </>
  );
}

function BlockSwitch({ block }: { block: PageBlock }) {
  const c = block.content as Record<string, string | number | boolean | unknown>;

  switch (block.block_type) {
    case 'announcement_bar':
      return (
        <div
          className="w-full py-2 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: (c.bg_color as string) ?? '#F5A800',
            color: (c.text_color as string) ?? '#000000',
          }}
        >
          {c.text as string}
          {Boolean(c.link_href) && (
            <a href={c.link_href as string} className="ml-2 underline">
              {(c.link_label as string) ?? 'Learn more'}
            </a>
          )}
        </div>
      );

    case 'hero':
      if (c.schema_version === '1.0.0' || c.bg_video_url || c.bg_image_url) {
        return <CMSHeroWrapper content={c as any} />;
      }
      return (
        <section
          className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
          style={
            Boolean(c.bg_image_url)
              ? { backgroundImage: `url(${c.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
        >
          {Boolean(c.bg_image_url) && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: (c.overlay_opacity as number) ?? 0.4 }}
            />
          )}
          <div className="relative z-10 text-center px-6">
            {Boolean(c.title) && (
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
                {c.title as string}
              </h1>
            )}
            {Boolean(c.subtitle) && (
              <p className="text-lg md:text-xl opacity-80 mb-8 max-w-xl mx-auto">
                {c.subtitle as string}
              </p>
            )}
            {Boolean(c.cta_label) && Boolean(c.cta_href) && (
              <a
                href={c.cta_href as string}
                className="inline-block px-8 py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-white/90 transition-colors"
              >
                {c.cta_label as string}
              </a>
            )}
          </div>
        </section>
      );

    case 'text_rich':
      return (
        <section className="max-w-3xl mx-auto px-6 py-16">
          {Boolean(c.heading) && (
            <h2 className="text-3xl font-bold mb-6 text-text-primary">{c.heading as string}</h2>
          )}
          {Boolean(c.body_html) && (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: c.body_html as string }}
            />
          )}
        </section>
      );

    case 'image_full': {
      const imageUrl = c.image_url as string;
      const altText = (c.alt_text as string) ?? '';
      // Same-origin assets go through Next's image optimizer (auto AVIF/WebP + responsive sizing);
      // arbitrary CMS-pasted external URLs stay raw since their host may not be allowlisted.
      const image = imageUrl?.startsWith('/') ? (
        <Image src={imageUrl} alt={altText} width={1920} height={1080} sizes="100vw" className="w-full h-auto object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={altText} className="w-full object-cover" />
      );
      return (
        <section className="w-full">
          {Boolean(c.link_href) ? <a href={c.link_href as string}>{image}</a> : image}
          {Boolean(c.caption) && (
            <p className="text-center text-sm text-text-muted mt-2 px-4">{c.caption as string}</p>
          )}
        </section>
      );
    }

    case 'cta_banner':
      return (
        <section
          className="py-16 px-6 text-center"
          style={{ backgroundColor: (c.bg_color as string) ?? '#111111' }}
        >
          {Boolean(c.heading) && (
            <h2 className="text-3xl font-bold text-white mb-3">{c.heading as string}</h2>
          )}
          {Boolean(c.subtext) && (
            <p className="text-white/70 mb-8 max-w-lg mx-auto">{c.subtext as string}</p>
          )}
          {Boolean(c.cta_label) && Boolean(c.cta_href) && (
            <a
              href={c.cta_href as string}
              className="inline-block px-8 py-3 font-bold uppercase tracking-wider"
              style={{
                backgroundColor: (c.accent_color as string) ?? '#F5A800',
                color: '#000000',
              }}
            >
              {c.cta_label as string}
            </a>
          )}
        </section>
      );

    case 'countdown_timer':
      return <CountdownBlock content={c} />;

    case 'spacer':
      return <div style={{ height: `${(c.height_px as number) ?? 40}px` }} />;

    case 'divider':
      return (
        <div className="px-6 py-4">
          <hr
            className="border-t"
            style={{
              borderStyle: (c.style as string) ?? 'solid',
              borderColor: (c.color as string) ?? 'rgba(255,255,255,0.1)',
            }}
          />
        </div>
      );

    case 'product_carousel': {
      if (c.collection_slug || c.schema_version === '1.0.0') {
        return <CMSBestSellerWrapper content={c as any} />;
      }
      const heading = (c.heading as string) || 'New Drops';
      const tag = (c.tag as string) || '';
      return <ProductCarouselBlock heading={heading} tag={tag} />;
    }

    case 'image_grid': {
      const images = (c.images as Array<{ url: string; alt?: string; href?: string }>) ?? [];
      const cols = (c.columns as number) ?? 2;
      const gridCols = cols === 4 ? 'grid-cols-2 md:grid-cols-4' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';
      return (
        <section className="max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6 py-12">
          <div className={cn('grid gap-4 md:gap-6', gridCols)}>
            {images.map((img, i) => {
              const content = (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-base-elevated border border-border group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              );
              return img.href ? (
                <a key={i} href={img.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={i}>{content}</div>
              );
            })}
          </div>
        </section>
      );
    }

    case 'collection_grid': {
      const heading = (c.heading as string) || 'Collections';
      return <CollectionGridBlock heading={heading} />;
    }

    case 'video_embed': {
      const url = c.url as string;
      if (!url) return null;
      return (
        <section className="max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6 py-12">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
            <iframe
              src={url}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      );
    }

    case 'brand_story': {
      return <CMSBrandStoryWrapper content={c as any} />;
    }

    case 'lookbook': {
      return <CMSLookbookWrapper content={c as any} />;
    }

    case 'reviews': {
      return <CMSReviewsWrapper content={c as any} />;
    }

    default:
      return null;
  }
}

// ── Countdown sub-component ──────────────────────────────────

function CountdownBlock({ content }: { content: Record<string, unknown> }) {
  const target = content.target_datetime as string;
  const heading = content.heading as string;
  const ctaLabel = content.cta_label as string;
  const ctaHref = content.cta_href as string;

  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  }>({ days: '--', hours: '--', minutes: '--', seconds: '--' });

  useEffect(() => {
    if (!target) return;

    function tick() {
      const targetTime = new Date(target).getTime();
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <section className="py-16 px-6 text-center bg-base-elevated">
      {heading && <h2 className="text-3xl font-bold text-text-primary mb-8">{heading}</h2>}
      <div className="flex justify-center gap-6 mb-8">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-4xl font-black text-nectar-400">
              {item.value}
            </span>
            <span className="text-xs text-text-muted uppercase tracking-widest mt-1">{item.label}</span>
          </div>
        ))}
      </div>
      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="inline-block px-8 py-3 bg-nectar-400 text-black font-bold uppercase hover:bg-nectar-300 transition-colors">
          {ctaLabel}
        </a>
      )}
    </section>
  );
}

// ── Product Carousel sub-component ────────────────────────────

function ProductCarouselBlock({ heading, tag }: { heading: string; tag: string }) {
  const { data: products, isLoading } = useQuery({
    queryKey: ['carousel-products', tag],
    queryFn: async () => {
      const db = getSupabaseClient();
      
      let query = db
        .from('products')
        .select(`
          id,
          title,
          slug,
          featured_image_url,
          metadata,
          status,
          product_variants(id, price)
        `)
        .eq('status', 'active')
        .limit(10);

      // Optionally filter by tag if present in product metadata
      const { data, error } = await query;
      if (error || !data) return [];

      const mapped = data.map((p: any) => {
        const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        return {
          id: p.id,
          name: p.title,
          price: minPrice,
          image: p.featured_image_url,
          image2: p.metadata?.gallery_images?.[1] || p.featured_image_url,
          slug: p.slug,
          category: p.metadata?.category || 'Street',
        };
      });

      if (tag) {
        return mapped.filter((p: any) => 
          p.category?.toLowerCase() === tag.toLowerCase() || 
          p.name?.toLowerCase().includes(tag.toLowerCase())
        );
      }
      return mapped;
    }
  });

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="h-8 w-8 border-2 border-nectar-400/30 border-t-nectar-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 w-full max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6">
      <div className="flex justify-between items-end mb-6">
        <h2 className="font-display text-[32px] md:text-[48px] uppercase leading-none">
          {heading}
        </h2>
      </div>
      <ProductCarouselComponent products={products} />
    </section>
  );
}

// ── Collection Grid sub-component ────────────────────────────

function CollectionGridBlock({ heading }: { heading: string }) {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['collection-grid-data'],
    queryFn: async () => {
      const db = getSupabaseClient();
      const { data, error } = await db
        .from('products')
        .select('metadata')
        .eq('status', 'active')
        .limit(100);
      if (error || !data) return [];
      
      const categories = Array.from(new Set(data.map((p: any) => p.metadata?.category || 'Street')));
      return categories.slice(0, 3).map((cat, i) => ({
        id: cat,
        name: cat,
        slug: cat.toLowerCase(),
        image: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop',
        ][i % 3],
      }));
    }
  });

  if (isLoading || !collections || collections.length === 0) return null;

  return (
    <section className="max-w-[min(95vw,2400px)] mx-auto px-4 md:px-6 py-12">
      {heading && <h2 className="font-display text-[32px] md:text-[48px] uppercase leading-none mb-8">{heading}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collections.map((col) => (
          <a
            key={col.id}
            href={`/collections`}
            className="group relative aspect-[4/5] bg-base-elevated overflow-hidden rounded-xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={col.image}
              alt={col.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <h3 className="font-display text-2xl text-white uppercase">{col.name}</h3>
              <span className="text-xs text-white/60 font-mono tracking-widest mt-1 uppercase">Shop Collection</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
