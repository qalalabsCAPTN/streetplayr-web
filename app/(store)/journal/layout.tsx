import type { Metadata } from "next";

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
      <main>{children}</main>
    </div>
  );
}
