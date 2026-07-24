import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeIntroOverlay from "@/components/ui/HomeIntroOverlay";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="home-layout min-h-screen">
      <HomeIntroOverlay />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
