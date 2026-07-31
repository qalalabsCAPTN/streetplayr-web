import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="home-layout min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
