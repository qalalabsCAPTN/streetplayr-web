"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import CollectionHero from "@/components/sections/collections/CollectionHero";
import CategoryFilter from "@/components/sections/collections/CategoryFilter";
import EditorialFeed from "@/components/sections/collections/EditorialFeed";
import AtmosphericSpacer from "@/components/sections/collections/AtmosphericSpacer";

function CollectionsInner() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const initialCategory = categoryParam
    ? categoryParam.toUpperCase().replace("-", " ")
    : "ALL";

  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // If the initial category (from URL) doesn't match a valid filter, reset to ALL
  const validCategories = ["ALL", "TEES", "WAFFLE", "TANKS", "TRACKS", "LIMITED DROP"];
  const normalizedCategory = validCategories.includes(activeCategory)
    ? activeCategory
    : "ALL";

  return (
    <div className="flex flex-col w-full overflow-hidden pb-24">
      <CollectionHero />
      <CategoryFilter activeCategory={normalizedCategory} onSelect={setActiveCategory} />
      <EditorialFeed activeCategory={normalizedCategory} />
      <AtmosphericSpacer />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense>
      <CollectionsInner />
    </Suspense>
  );
}
