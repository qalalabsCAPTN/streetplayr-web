import SmoothScrolling from "@/components/ui/SmoothScrolling";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="collections-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .collections-layout, .collections-layout * {
            cursor: none !important;
          }
        `
      }} />
      <CustomCursor />
      <SmoothScrolling>
        <Navbar />
        <main className="bg-noise bg-[#050505]">{children}</main>
        <Footer />
      </SmoothScrolling>
    </div>
  );
}
