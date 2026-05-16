import type { Metadata } from "next";
import CustomCursor from "@/components/ui/CustomCursor";

export const metadata: Metadata = {
  title: "Journal — Street PlayR | Field Notes",
  description:
    "Field notes from Street PlayR. Not documentation. Culture in motion. Archive of intent.",
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="journal-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .journal-layout, .journal-layout * {
            cursor: none !important;
          }
        `
      }} />
      <CustomCursor />
      <main>{children}</main>
    </div>
  );
}
