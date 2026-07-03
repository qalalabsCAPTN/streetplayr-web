import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About — Street PlayR | Born From the Streets",
  description:
    "Street PlayR is not a brand. It is a position. Luxury streetwear built for those who move without permission.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="pb-28 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
