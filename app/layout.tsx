import type { Metadata } from "next";
import { Anton, Bebas_Neue, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Loader from "@/components/ui/Loader";
import EntryGate from "@/components/ui/EntryGate";
import AuthProvider from "@/components/auth/AuthProvider";
import RealtimeProvider from "@/components/auth/RealtimeProvider";
import SmoothScrolling from "@/components/ui/SmoothScrolling";
import { getProfileAction } from "@/app/actions/auth";
import "./globals.css";

// Root layout calls getProfileAction() → createClient() → cookies().
// This requires a request context — prevent static prerender attempts.
export const dynamic = 'force-dynamic';

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

const gothic = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sp-gothic",
});

export const metadata: Metadata = {
  title: "Street PlayR | Enter The Play",
  description:
    "Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getProfileAction();

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${gothic.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <AuthProvider initialUser={user}>
          <RealtimeProvider>
            <SmoothScrolling>
              <EntryGate />
              <Loader />
              {children}
            </SmoothScrolling>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
