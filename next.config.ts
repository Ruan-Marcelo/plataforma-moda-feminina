// RUAN MARCELO RAMACIOTI LUZ
import type { NextConfig } from "next";

const privateHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/(.*)", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ] },
      ...["/api/admin/:path*", "/api/auth/:path*", "/api/virtual-fitting", "/api/local-images/:path*", "/api/catalog-images/:path*", "/api/favorites"].map(source => ({ source, headers: privateHeaders })),
    ];
  },
};
export default nextConfig;
