import CustomCursor from "@/components/ui/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="home-layout min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
          .home-layout, .home-layout * {
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
