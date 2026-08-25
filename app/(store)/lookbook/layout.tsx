import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Lookbook — StreetplayR | SS/25 Archive",
  description:
    "The SS/25 campaign archive. Controlled chaos. Built in silence. StreetplayR luxury editorial lookbook.",
};

export default function LookbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lookbook-layout min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
