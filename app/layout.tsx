import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Loader from "@/components/ui/Loader";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sp-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sp-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sp-mono",
});

export const metadata: Metadata = {
  title: "Street PlayR | Enter The Play",
  description:
    "Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <AuthProvider>
          <Loader />
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

