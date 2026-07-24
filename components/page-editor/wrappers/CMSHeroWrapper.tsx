'use client';

import HomeHero from "@/components/sections/home/HomeHero";

interface CMSHeroContent {
  schema_version?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_href?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  overlay_opacity?: number;
}

interface CMSHeroWrapperProps {
  content: CMSHeroContent;
}

export default function CMSHeroWrapper({ content }: CMSHeroWrapperProps) {
  // Validate schema version if needed, then render pristine HomeHero with props mapping
  return (
    <HomeHero
      title={content.title}
      subtitle={content.subtitle}
      ctaLabel={content.cta_label?.trim() || "Shop Now"}
      ctaHref={content.cta_href?.trim() || "/collections"}
      bgImageUrl={content.bg_image_url}
      bgVideoUrl={content.bg_video_url}
      overlayOpacity={content.overlay_opacity}
    />
  );
}
