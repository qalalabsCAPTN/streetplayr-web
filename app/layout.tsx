import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Anton, Inter, Space_Mono } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import RealtimeProvider from "@/components/auth/RealtimeProvider";
import { QueryProvider } from "@/providers/query-provider";
import DeferredChrome from "@/components/ui/DeferredChrome";
import { AuthService } from "@/lib/auth/service";
import {
  GA4_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  GSC_VERIFICATION,
  GTM_ID,
  META_PIXEL_ID,
} from "@/lib/analytics/tags";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://streetplayr.com"),
  title: {
    default: "StreetplayR | Enter The Play",
    template: "%s | StreetplayR",
  },
  description: "StreetplayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
  verification: {
    google: GSC_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "StreetplayR | Enter The Play",
    description: "StreetplayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
    url: "https://streetplayr.com",
    siteName: "StreetplayR",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreetplayR | Enter The Play",
    description: "StreetplayR - Enter The Play. Exclusive drops, luxury streetwear membership.",
  },
};

/**
 * Auth still SSR'd for zero-flicker session (cookies() → dynamic).
 * Public data fetches elsewhere use createStaticClient + revalidate for cache hits.
 * GTM uses afterInteractive (non-blocking render, conversion-safe).
 *
 * force-dynamic: root layout reads cookies via AuthService.getCurrentProfile().
 * Without this, Next tries to statically prerender routes like /auth/auth-code-error
 * and throws DYNAMIC_SERVER_USAGE (logged as "Failed to load initial user…").
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    user = await AuthService.getCurrentProfile();
  } catch (err) {
    // Ignore expected dynamic-bail during tooling; log real failures only.
    const digest =
      err && typeof err === "object" && "digest" in err
        ? String((err as { digest?: string }).digest)
        : "";
    if (digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("Failed to load initial user on server layout:", err);
    }
  }

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`
          }}
        />
      </head>
      <body className="min-h-full bg-transparent text-white">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_MEASUREMENT_ID}');
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "StreetplayR",
              "url": "https://streetplayr.com",
              "logo": "https://streetplayr.com/playR.street logo.png",
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
              "name": "StreetplayR",
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
