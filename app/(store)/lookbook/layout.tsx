import type { Metadata } from "next";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Lookbook — Street PlayR | SS/25 Archive",
  description:
    "The SS/25 campaign archive. Controlled chaos. Built in silence. Street PlayR luxury editorial lookbook.",
};

export default function LookbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lookbook-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .lookbook-layout, .lookbook-layout * {
            cursor: none !important;
          }
        `
      }} />
      <CustomCursor />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
