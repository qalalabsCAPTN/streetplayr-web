"use client";

import { useState } from "react";
import CollectionHero from "@/components/sections/collections/CollectionHero";
import CategoryFilter from "@/components/sections/collections/CategoryFilter";
import EditorialFeed from "@/components/sections/collections/EditorialFeed";
import AtmosphericSpacer from "@/components/sections/collections/AtmosphericSpacer";

export default function CollectionsPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  return (
    <div className="flex flex-col w-full overflow-hidden pb-24">
      <CollectionHero />
      <CategoryFilter activeCategory={activeCategory} onSelect={setActiveCategory} />
      <EditorialFeed activeCategory={activeCategory} />
      <AtmosphericSpacer />
    </div>
  );
}
