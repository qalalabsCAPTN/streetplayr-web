import JournalOpening from "@/components/sections/journal/JournalOpening";
import JournalEditorialFeed from "@/components/sections/journal/JournalEditorialFeed";
import JournalManifesto from "@/components/sections/journal/JournalManifesto";
import JournalClosing from "@/components/sections/journal/JournalClosing";

export default function JournalPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#050505]">
      {/* 1. Cinematic opening frame */}
      <JournalOpening />

      {/* 2. Editorial feed — campaign entries as story fragments */}
      <JournalEditorialFeed />

      {/* 3. Manifesto — cultural positioning */}
      <JournalManifesto />

      {/* 4. Closing — restrained, no CTA */}
      <JournalClosing />
    </div>
  );
}
