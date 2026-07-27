import type { NextConfig } from "next";

/**
 * Origin Supabase, diturunkan dari env var supaya project ref tidak pernah
 * ditulis dua kali. Dipakai untuk pola gambar remote dan untuk CSP dasbor.
 */
function supabaseOrigin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Cover images live in Supabase Storage, on a different origin from the app.
 * next/image refuses remote hosts unless they are listed here, and the list is
 * derived from the env var so a project ref never gets hardcoded in two places.
 */
function supabaseImagePattern() {
  const origin = supabaseOrigin();
  if (!origin) return [];
  return [
    {
      protocol: "https" as const,
      hostname: new URL(origin).hostname,
      pathname: "/storage/v1/object/public/post-covers/**",
    },
  ];
}

/**
 * CSP khusus `/admin`.
 *
 * Bisa ditegakkan di sini justru karena dasbor tidak memasang `next-themes` —
 * script inline penyetel tema itulah yang membuat CSP ketat merepotkan di sisi
 * publik. Sisi publik sengaja dibiarkan tanpa CSP untuk sekarang: ia memuat
 * script tema inline dan JSON-LD, keduanya butuh nonce per-permintaan, dan
 * merusak situs live yang skor Lighthouse-nya 100 demi menutup satu kotak
 * centang adalah pertukaran yang salah.
 *
 * `script-src` masih memuat 'unsafe-inline' karena bootstrap dan flight data
 * Next dikirim sebagai script inline; menghapusnya butuh nonce yang dialirkan
 * lewat middleware. Yang seharusnya ditutup nonce sudah tertutup di akarnya:
 * tidak ada satu pun permukaan dasbor yang merender HTML tak tepercaya —
 * pratinjau artikel lewat <PostBody>, yang membangun elemen React dan tidak
 * pernah menyentuh dangerouslySetInnerHTML.
 */
function dashboardCsp() {
  const supabase = supabaseOrigin();
  const img = ["'self'", "data:", "blob:", supabase].filter(Boolean).join(" ");
  const connect = ["'self'", supabase].filter(Boolean).join(" ");

  // next dev membangun ulang modul lewat eval; tanpa ini dasbor tidak bisa
  // dibuka sama sekali saat pengembangan.
  const script =
    process.env.NODE_ENV === "production"
      ? "'self' 'unsafe-inline'"
      : "'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    `img-src ${img}`,
    `connect-src ${connect}`,
    "style-src 'self' 'unsafe-inline'",
    `script-src ${script}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const baseSecurityHeaders = [
  // Dua tahun + preload: domainnya hanya pernah dilayani lewat HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePattern(),
    // Uploads are re-encoded to webp on the way in; SVG is never accepted, so
    // the optimizer never has to handle one.
    dangerouslyAllowSVG: false,
  },
  experimental: {
    serverActions: {
      // Cover boleh sampai 5 MB (batas bucket dan MAX_COVER_BYTES). Batas
      // bawaan Server Action adalah 1 MB, sehingga tanpa baris ini setiap foto
      // asli gagal sebelum src/lib/covers.ts sempat berjalan — dan errornya
      // mudah salah didiagnosis sebagai masalah sharp.
      bodySizeLimit: "6mb",
    },
  },
  /**
   * Ditaruh di sini, bukan di middleware: berlaku juga saat `next dev` (blok
   * `headers` di vercel.json tidak), satu tempat deklaratif alih-alih logika
   * yang tersebar, dan tidak menambah kerja per-permintaan pada rute publik
   * yang seharusnya disajikan dari cache.
   */
  async headers() {
    return [
      { source: "/:path*", headers: baseSecurityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "Content-Security-Policy", value: dashboardCsp() }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
