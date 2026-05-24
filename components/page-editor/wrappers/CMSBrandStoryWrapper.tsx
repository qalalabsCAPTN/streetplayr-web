'use client';

import BrandStory from "@/components/sections/home/BrandStory";

interface BrandStoryBlock {
  title: string;
  description: string;
  image_url?: string;
}

interface CMSBrandStoryContent {
  schema_version?: string;
  heading?: string;
  subheading?: string;
  blocks?: BrandStoryBlock[];
  cta_label?: string;
  cta_href?: string;
  video_url?: string;
}

interface CMSBrandStoryWrapperProps {
  content: CMSBrandStoryContent;
}

export default function CMSBrandStoryWrapper({ content }: CMSBrandStoryWrapperProps) {
  return (
    <BrandStory
      heading={content.heading}
      subheading={content.subheading}
      blocks={content.blocks}
      ctaLabel={content.cta_label}
      ctaHref={content.cta_href}
      videoUrl={content.video_url}
    />
  );
}
