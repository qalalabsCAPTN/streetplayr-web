import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact Us — Street PlayR | Born From the Streets",
  description:
    "Connect with the Street PlayR team. For order support, collaborations, press, or general inquiries, access our transmission portal.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#16111b]">
      <Navbar />
      <main className="pb-28 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
