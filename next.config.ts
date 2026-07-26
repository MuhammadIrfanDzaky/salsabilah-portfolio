import type { NextConfig } from "next";

/**
 * Cover images live in Supabase Storage, on a different origin from the app.
 * next/image refuses remote hosts unless they are listed here, and the list is
 * derived from the env var so a project ref never gets hardcoded in two places.
 */
function supabaseImagePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    return [
      {
        protocol: "https" as const,
        hostname: new URL(url).hostname,
        pathname: "/storage/v1/object/public/post-covers/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePattern(),
    // Uploads are re-encoded to webp on the way in; SVG is never accepted, so
    // the optimizer never has to handle one.
    dangerouslyAllowSVG: false,
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
