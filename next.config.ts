import type { NextConfig } from "next";
import { validateEnvironment } from "./lib/env/validate";

// STARTUP-BLOCKING: validates critical env vars before build/server init.
// In production, missing required vars throw and abort startup.
validateEnvironment();

const nextConfig: NextConfig = {
  // Tree-shake heavy barrel packages (framer-motion, lucide, R3F helpers)
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@react-three/drei",
      "@react-three/fiber",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // AI Try-On result images from IDM-VTON on HuggingFace Spaces
      { protocol: "https", hostname: "*.hf.space" },
      { protocol: "https", hostname: "yisol-idm-vton.hf.space" },
      // Supabase storage (garment + user photo uploads)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
