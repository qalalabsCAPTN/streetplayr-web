import SmoothScrolling from "@/components/ui/SmoothScrolling";
import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="product-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .product-layout, .product-layout * {
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
