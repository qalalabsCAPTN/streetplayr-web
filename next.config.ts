import type { NextConfig } from "next";
import { validateEnvironment } from "./lib/env/validate";

// STARTUP-BLOCKING: validates critical env vars before build/server init.
// In production, missing required vars throw and abort startup.
validateEnvironment();

const nextConfig: NextConfig = {
  images: {
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
