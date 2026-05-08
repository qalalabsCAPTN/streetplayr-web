import LookbookOpening from "@/components/sections/lookbook/LookbookOpening";
import LookbookEditorialFeed from "@/components/sections/lookbook/LookbookEditorialFeed";
import LookbookStoryFragments from "@/components/sections/lookbook/LookbookStoryFragments";
import LookbookSilenceMoment from "@/components/sections/lookbook/LookbookSilenceMoment";
import LookbookClosing from "@/components/sections/lookbook/LookbookClosing";

export default function LookbookPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#050505]">
      {/* 1. Cinematic opening frame */}
      <LookbookOpening />

      {/* 2. Editorial campaign feed — main experience */}
      <LookbookEditorialFeed />

      {/* 3. Story fragments — cultural positioning */}
      <LookbookStoryFragments />

      {/* 4. Visual silence — one image, alone */}
      <LookbookSilenceMoment />

      {/* 5. Closing — archive CTA */}
      <LookbookClosing />
    </div>
  );
}
