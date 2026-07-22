import type { Metadata } from "next";
import Script from "next/script";
import { Anton, Inter, Space_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import RealtimeProvider from "@/components/auth/RealtimeProvider";
import { getProfileAction } from "@/app/actions/auth";
import { QueryProvider } from "@/providers/query-provider";
import ScrollDamping from "@/components/ui/ScrollDamping";
import GlobalParticles from "@/components/ui/GlobalParticles";
import "./globals.css";

export const dynamic = 'force-dynamic';

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sp-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sp-body",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sp-mono",
  display: "swap",
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
                "https://instagram.com/streetplayr",
                "https://linkedin.com/company/streetplayr"
              ]
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
              "url": "https://streetplayr.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://streetplayr.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <ScrollDamping />
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </AuthProvider>
        </QueryProvider>
        <GlobalParticles />
      </body>
    </html>
  );
}
