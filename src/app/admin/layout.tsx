import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import { adminCopy } from "@/data/admin-copy";
import "../globals.css";

/**
 * Akar dasbor admin.
 *
 * Merender `<html>`/`<body>` sendiri karena project ini TIDAK punya
 * `src/app/layout.tsx` — yang memegangnya adalah `[locale]/layout.tsx`. Tanpa
 * layout ini, `/admin` akan mewarisi masalah yang sudah didokumentasikan
 * panjang lebar di `src/app/not-found.tsx`: utilitas Tailwind diam-diam tidak
 * menghasilkan apa pun dan token `@theme` tidak ada di `:root`. Bedanya,
 * di sini `globals.css` memang diimpor, jadi Tailwind dan tokennya bekerja
 * normal dan dasbor bisa memakai warna yang sama dengan situs publik.
 *
 * Gate autentikasi TIDAK ada di sini: halaman masuk berada di bawah layout ini
 * dan akan mengarahkan ulang ke dirinya sendiri tanpa henti. Gate-nya ada di
 * `(dasbor)/layout.tsx`.
 */

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: adminCopy.brand,
  // Berlapis dengan `Disallow: /admin` di src/app/robots.ts. Robots.txt adalah
  // permintaan; header ini instruksi.
  robots: { index: false, follow: false },
};

/**
 * Mode gelap tanpa JavaScript.
 *
 * Situs publik menukar tema lewat kelas `.dark` yang dipasang next-themes.
 * Dasbor tidak memasang provider itu — satu pengguna, satu perangkat, tidak
 * perlu penyetel tema — jadi tanpa blok ini dasbor akan selalu terang meski
 * sistemnya gelap. Nilainya disalin dari blok `.dark` di globals.css.
 *
 * Selektornya `html:root`, bukan `:root`: spesifisitasnya lebih tinggi
 * sehingga menang atas globals.css berapa pun urutan penyisipan stylesheet.
 */
const darkTokens = `
@media (prefers-color-scheme: dark) {
  html:root {
    --paper: #141913;
    --surface: #1d241b;
    --green: #24382b;
    --green-deep: #1a2a20;
    --sage: #8fae93;
    --sand: #c9b790;
    --ink: #eae6d9;
    --muted: #aab3a1;
    --accent: #d08b62;
    --accent-strong: #dd9d75;
    --on-accent: #2a1608;
    --on-green: #ede9dc;
    --on-green-soft: rgba(237, 233, 220, 0.8);
    --on-green-strong: #f8f5ea;
    --line: rgba(201, 183, 144, 0.18);
    --line-on-green: rgba(201, 183, 144, 0.3);
    --nav-text: #c4cbba;
    --shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.3), 0 18px 44px -22px rgba(0, 0, 0, 0.55);
  }
}
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <head>
        <style>{darkTokens}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
