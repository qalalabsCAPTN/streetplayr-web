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
      <Navbar />
      <main className="pb-28 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
