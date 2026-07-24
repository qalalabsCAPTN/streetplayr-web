import type { Metadata } from "next";
import Script from "next/script";
import { Anton, Archivo, Inter, Space_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import RealtimeProvider from "@/components/auth/RealtimeProvider";
import { QueryProvider } from "@/providers/query-provider";
import DeferredChrome from "@/components/ui/DeferredChrome";
import { AuthService } from "@/lib/auth/service";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sp-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sp-body",
  display: "optional",
  preload: true,
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sp-mono",
  display: "swap",
  preload: false,
});

/** Replaces render-blocking fonts.googleapis.com Archivo CSS in storefront.css */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://streetplayr.com"),
  title: {
    default: "Street PlayR | Enter The Play",
    template: "%s | Street PlayR",
  },
  description: "Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Street PlayR | Enter The Play",
    description: "Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
    url: "https://streetplayr.com",
    siteName: "Street PlayR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Street PlayR | Enter The Play",
    description: "Street PlayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
  },
};

/**
 * Auth still SSR'd for zero-flicker session (cookies() → dynamic).
 * Public data fetches elsewhere use createStaticClient + revalidate for cache hits.
 * GTM uses afterInteractive (non-blocking render, conversion-safe).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    user = await AuthService.getCurrentProfile();
  } catch (err) {
    console.error("Failed to load initial user on server layout:", err);
  }

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full bg-transparent text-white">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18205202945"
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18205202945');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Street PlayR",
              "url": "https://streetplayr.com",
              "logo": "https://streetplayr.com/assets/streetplayr-logo.png",
              "sameAs": [
                "https://www.instagram.com/playr.street/",
                "https://www.facebook.com/people/StreetplayR/61590647487431/",
                "https://www.youtube.com/@playR_vip",
                "https://www.linkedin.com/company/playrbrand"
              ],
              "email": "orders@playR.in",
              "telephone": "+91-95993-70409"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Street PlayR",
              "url": "https://streetplayr.com"
            })
          }}
        />
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </AuthProvider>
        </QueryProvider>
        <DeferredChrome />
      </body>
    </html>
  );
}
