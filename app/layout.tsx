import type { Metadata } from "next";
import { Anton, Inter, Space_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import RealtimeProvider from "@/components/auth/RealtimeProvider";
import { getProfileAction } from "@/app/actions/auth";
import { QueryProvider } from "@/providers/query-provider";
import ScrollDamping from "@/components/ui/ScrollDamping";
import "./globals.css";

export const dynamic = 'force-dynamic';

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sp-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sp-body",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sp-mono",
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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <ScrollDamping />
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
