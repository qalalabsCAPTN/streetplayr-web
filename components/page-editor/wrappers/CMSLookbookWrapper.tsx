'use client';

import Lookbook from "@/components/sections/home/Lookbook";

interface LookbookItem {
  id: string;
  type: "video" | "youtube" | "placeholder";
  src: string;
  label: string;
  href: string;
  widthClass?: string;
}

interface CMSLookbookContent {
  schema_version?: string;
  title?: string;
  description?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
  alignment?: string;
  items?: LookbookItem[];
}

interface CMSLookbookWrapperProps {
  content: CMSLookbookContent;
}

export default function CMSLookbookWrapper({ content }: CMSLookbookWrapperProps) {
  // Support both list items or constructed single-banner layout
  let activeItems: LookbookItem[] | undefined = content.items;

  if (!activeItems && content.image_url) {
    activeItems = [
      {
        id: "cms-lookbook-banner",
        type: "placeholder",
        src: content.image_url,
        label: content.title || "SS26 DISCORDANCE",
        href: content.cta_href || "/collections",
        widthClass: "w-[45vw] min-w-[280px] max-w-[680px]"
      }
    ];
  }

  return (
    <Lookbook
      title={content.title}
      description={content.description}
      items={activeItems}
    />
  );
}
