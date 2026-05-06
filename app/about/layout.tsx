import type { Metadata } from "next";
import SmoothScrolling from "@/components/ui/SmoothScrolling";
import CustomCursor from "@/components/ui/CustomCursor";
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
    <div className="about-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .about-layout, .about-layout * {
            cursor: none !important;
          }
        `
      }} />
      <CustomCursor />
      <SmoothScrolling>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </SmoothScrolling>
    </div>
  );
}
