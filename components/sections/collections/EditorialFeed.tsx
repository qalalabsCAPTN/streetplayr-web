"use client";

import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

export type FeedItemType = "product" | "campaign" | "typography";

export interface FeedItemData {
  id: string;
  type: FeedItemType;
  category: string;
  layoutType: "tall" | "square" | "landscape" | "full";
  // Product specific
  slug?: string;
  title?: string;
  price?: string;
  image1?: string;
  image2?: string;
  metadata?: {
    drop: string;
    fabric: string;
  };
  // Campaign / Typography specific
  content?: string;
  image?: string;
}

const MOCK_FEED: FeedItemData[] = [
  {
    id: "p1",
    type: "product",
    slug: "srh-jersey-01",
    title: "SRH Jersey 01",
    price: "$120.00",
    image1: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1200&auto=format&fit=crop",
    category: "TEES",
    metadata: { drop: "DROP 01", fabric: "320 GSM HEAVYWEIGHT" },
    layoutType: "tall"
  },
  {
    id: "p2",
    type: "product",
    slug: "core-waffle-ls",
    title: "Core Waffle L/S",
    price: "$95.00",
    image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    category: "WAFFLE",
    metadata: { drop: "LIMITED", fabric: "400 GSM THERMAL" },
    layoutType: "square"
  },
  {
    id: "c1",
    type: "typography",
    category: "ALL", // shows everywhere if desired, or maybe just ALL
    layoutType: "full",
    content: "STRIPPED OF EXCESS. DEFINED BY FORM. ARCHITECTURE FOR THE STREETS."
  },
  {
    id: "c3",
    type: "campaign",
    category: "ALL",
    layoutType: "full",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=2000&auto=format&fit=crop",
    content: "STUDY IN FORM."
  },
  {
    id: "p3",
    type: "product",
    slug: "track-pant-02",
    title: "Nylon Track Pant",
    price: "$145.00",
    image1: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=1200&auto=format&fit=crop",
    category: "TRACKS",
    metadata: { drop: "DROP 02", fabric: "WATER-REPELLENT NYLON" },
    layoutType: "landscape"
  },
  {
    id: "p4",
    type: "product",
    slug: "ribbed-tank-pack",
    title: "Ribbed Tank Pack",
    price: "$65.00",
    image1: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1534961880437-ce5ae2033053?q=80&w=1200&auto=format&fit=crop",
    category: "TANKS",
    metadata: { drop: "CORE", fabric: "2X1 COTTON RIB" },
    layoutType: "tall"
  },
  {
    id: "c2",
    type: "campaign",
    category: "ALL",
    layoutType: "full",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2000&auto=format&fit=crop"
  },
  {
    id: "p5",
    type: "product",
    slug: "heavy-zip-hoodie",
    title: "Structural Zip Hoodie",
    price: "$180.00",
    image1: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1200&auto=format&fit=crop",
    category: "LIMITED DROP",
    metadata: { drop: "ARCHIVE", fabric: "500 GSM FRENCH TERRY" },
    layoutType: "square"
  },
  {
    id: "p6",
    type: "product",
    slug: "vintage-wash-tee",
    title: "Vintage Wash Tee",
    price: "$75.00",
    image1: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
    image2: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    category: "TEES",
    metadata: { drop: "DROP 02", fabric: "GARMENT DYED COTTON" },
    layoutType: "tall"
  }
];

interface EditorialFeedProps {
  activeCategory: string;
}

export default function EditorialFeed({ activeCategory }: EditorialFeedProps) {
  const filteredFeed = MOCK_FEED.filter(item => {
    if (activeCategory === "ALL") return true;
    // Keep campaign items if viewing a specific category? Or filter them out? 
    // Let's hide campaign/typography on specific category filters to keep it focused.
    return item.category === activeCategory && item.type === "product";
  });

  return (
    <section className="mx-auto w-full max-w-[1800px] px-0 md:px-12 py-12 md:py-24">
      <motion.div 
        layout
        className="grid grid-cols-1 gap-y-16 gap-x-8 md:grid-cols-12 md:gap-y-32 items-center"
      >
        {filteredFeed.map((item, index) => {
          let desktopSpan = "md:col-span-6";
          let alignClass = "";
          let marginClass = "";
          let opacityClass = "opacity-100"; // For hierarchy

          if (item.type === "campaign" || item.type === "typography") {
            desktopSpan = "md:col-span-12";
            marginClass = "md:my-24";
          } else {
            // Asymmetry for products
            const productIndex = index % 6;
            
            switch(productIndex) {
              case 0:
                desktopSpan = "md:col-span-7";
                marginClass = "md:mr-12";
                break;
              case 1:
                desktopSpan = "md:col-span-4 md:col-start-9";
                marginClass = "md:mt-32";
                opacityClass = "opacity-80 hover:opacity-100 transition-opacity duration-700"; // softer moment
                break;
              case 2:
                desktopSpan = "md:col-span-8 md:col-start-3";
                marginClass = "md:mt-16";
                break;
              case 3:
                desktopSpan = "md:col-span-5 md:col-start-2";
                opacityClass = "opacity-90 hover:opacity-100 transition-opacity duration-700";
                break;
              case 4:
                desktopSpan = "md:col-span-6 md:col-start-7";
                marginClass = "md:-mt-24"; // overlapping
                break;
              case 5:
                desktopSpan = "md:col-span-10 md:col-start-2";
                marginClass = "md:mt-24";
                break;
            }
          }

          return (
            <div 
              key={item.id} 
              className={`w-full ${desktopSpan} ${alignClass} ${marginClass} px-0 md:px-0`}
            >
              {item.type === "product" && (
                <div className={opacityClass}>
                  {/* @ts-ignore - we know it's a product here */}
                  <ProductCard product={item as any} index={index} />
                </div>
              )}

              {item.type === "typography" && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="px-6 py-24 text-center md:py-32"
                >
                  <h2 className="font-display text-[8vw] leading-[0.85] tracking-tighter text-[#d4ff1e] md:text-[5vw] text-balance">
                    {item.content}
                  </h2>
                </motion.div>
              )}

              {item.type === "campaign" && (
                <motion.div 
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[21/9]"
                  data-cursor="video"
                >
                  <img
                    src={item.image}
                    alt="Campaign Moment"
                    className="h-full w-full object-cover grayscale mix-blend-luminosity opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] opacity-80" />
                  {item.content && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 pointer-events-none mix-blend-plus-lighter">
                      <h3 className="font-display text-[6vw] md:text-[3vw] text-white/80 tracking-[0.2em]">{item.content}</h3>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>
      
      {/* Empty State */}
      {filteredFeed.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-[40vh] flex-col items-center justify-center text-center px-6"
        >
          <h2 className="font-display text-4xl uppercase text-white mb-4">Archive Empty</h2>
          <p className="font-body text-[#8c8c8c]">No pieces currently available in this category.</p>
        </motion.div>
      )}
    </section>
  );
}
