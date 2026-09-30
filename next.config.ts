import type { NextConfig } from "next";

// En-têtes de sécurité sur toutes les réponses. La CSP reste volontairement
// légère (pas de restriction des scripts, qui demanderait des nonces pour
// les scripts inline de Next) : elle interdit surtout l'affichage du site
// dans une iframe (clickjacking) et les plugins.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Cache disque de `next dev` coupé : sur le disque lent du poste de dev,
    // ses écritures et sa compaction occupaient le disque plusieurs minutes
    // et ralentissaient tout le PC. Le build (Vercel) garde son cache.
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
