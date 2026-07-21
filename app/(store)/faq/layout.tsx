import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FAQs — Street PlayR",
  description: "Answers to common questions about shipping, returns, sizing, and orders.",
};

export default function FaqLayout({
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
