import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal — StreetplayR | Field Notes",
  description:
    "Field notes from StreetplayR. Not documentation. Culture in motion. Archive of intent.",
};

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="journal-layout min-h-screen">
      <main>{children}</main>
    </div>
  );
}
