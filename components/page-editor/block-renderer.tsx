'use client';

import type { PageBlock } from '@/lib/page-editor/get-page-blocks';

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
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
                {c.title as string}
              </h1>
            )}
            {Boolean(c.subtitle) && (
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
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

    case 'image_full':
      return (
        <section className="w-full">
          {Boolean(c.link_href) ? (
            <a href={c.link_href as string}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image_url as string} alt={(c.alt_text as string) ?? ''} className="w-full object-cover" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image_url as string} alt={(c.alt_text as string) ?? ''} className="w-full object-cover" />
          )}
          {Boolean(c.caption) && (
            <p className="text-center text-sm text-text-muted mt-2 px-4">{c.caption as string}</p>
          )}
        </section>
      );

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

    // product_carousel, image_grid, collection_grid, video_embed
    // — these need async data; use separate async server components in the page
    case 'product_carousel':
    case 'image_grid':
    case 'collection_grid':
    case 'video_embed':
      return (
        <div className="text-center text-text-muted text-sm py-8">
          [{block.block_type} — render component goes here]
        </div>
      );

    default:
      return null;
  }
}

// ── Countdown sub-component ──────────────────────────────────

function CountdownBlock({ content }: { content: Record<string, unknown> }) {
  // Client-side only countdown
  const target = content.target_datetime as string;
  const heading = content.heading as string;
  const ctaLabel = content.cta_label as string;
  const ctaHref = content.cta_href as string;

  return (
    <section className="py-16 px-6 text-center bg-base-elevated">
      {heading && <h2 className="text-3xl font-bold text-text-primary mb-8">{heading}</h2>}
      <div className="flex justify-center gap-6 mb-8">
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((unit) => (
          <div key={unit} className="flex flex-col items-center">
            <span
              className="text-4xl font-black text-nectar-400"
              data-countdown-target={target}
              data-countdown-unit={unit.toLowerCase()}
            >
              --
            </span>
            <span className="text-xs text-text-muted uppercase tracking-widest mt-1">{unit}</span>
          </div>
        ))}
      </div>
      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="inline-block px-8 py-3 bg-nectar-400 text-black font-bold uppercase">
          {ctaLabel}
        </a>
      )}
    </section>
  );
}
