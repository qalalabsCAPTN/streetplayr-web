import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ScrollIndicator from "@/components/layout/ScrollIndicator";

export const dynamic = 'force-dynamic';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ScrollIndicator />
    </>
  );
}
