import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions — StreetplayR",
  description: "Terms & Conditions of service and membership rules for StreetplayR.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <main className="flex-grow pb-28 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
