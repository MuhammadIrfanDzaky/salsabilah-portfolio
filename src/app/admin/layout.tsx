import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import { adminCopy } from "@/data/admin-copy";
import { bacaTemaAdmin } from "@/lib/admin/tema";
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
 * Mode gelap tanpa JavaScript, untuk pilihan tema "sistem".
 *
 * Situs publik menukar tema lewat kelas `.dark` yang dipasang next-themes.
 * Dasbor tidak memasang provider itu; sejak 2026-08-05 ia punya penyetel
 * sendiri berbasis cookie (lihat `@/lib/admin/tema`), dan blok ini melayani
 * satu kasus saja: saat pilihannya "sistem", yaitu mengikuti
 * `prefers-color-scheme`. Nilainya disalin dari blok `.dark` di globals.css.
 *
 * **Hanya disuntikkan pada mode "sistem", dan itu wajib.** Kalau blok ini ikut
 * terpasang saat seseorang memilih "terang", `@media (prefers-color-scheme:
 * dark)` akan tetap memaksa gelap di perangkat yang setelan sistemnya gelap —
 * tombol Terang akan terlihat tertekan sementara layarnya tidak berubah sama
 * sekali, kegagalan yang tidak memunculkan error apa pun.
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tema = await bacaTemaAdmin();

  return (
    <html
      lang="id"
      className={[
        fraunces.variable,
        inter.variable,
        plexMono.variable,
        // Kelas `.dark` yang sama dengan situs publik, jadi tokennya datang
        // dari satu blok di globals.css alih-alih disalin lagi ke sini.
        tema === "gelap" ? "dark" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      // `color-scheme` memberi tahu peramban warna bawaan scrollbar dan kontrol
      // form. Tanpa ini, dasbor gelap tetap punya kolom input putih terang.
      style={{ colorScheme: tema === "sistem" ? "light dark" : tema === "gelap" ? "dark" : "light" }}
    >
      <head>{tema === "sistem" ? <style>{darkTokens}</style> : null}</head>
      <body>{children}</body>
    </html>
  );
}
