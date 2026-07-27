import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/masuk";

function isAdminPath(pathname: string) {
  // Dicocokkan persis, bukan startsWith("/admin") polos, supaya rute lain yang
  // kebetulan berawalan sama tidak ikut tertarik ke jalur berautentikasi.
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Dua tugas, dan hanya rute admin yang membayar tugas kedua.
 *
 * 1. Menyingkap path yang diminta ke server component lewat `x-pathname`.
 *    Halaman 404 butuh path untuk menjawab dalam bahasa pembaca, tapi
 *    `not-found.tsx` tidak menerima route params, dan membacanya di klien
 *    membuat paint pertama selalu salah bahasa sampai hidrasi menukarnya.
 *    Cara ini membuat bahasa yang benar tersedia sejak byte pertama.
 *
 * 2. Menyegarkan sesi Supabase dan menutup rute admin dari yang belum masuk.
 *    Pemeriksaan ini SENGAJA hanya berjalan di bawah `/admin`: menyentuh
 *    Supabase pada setiap permintaan publik berarti satu hop jaringan
 *    tambahan untuk halaman yang seharusnya disajikan statis dari CDN.
 *
 * Middleware bukan batas otorisasi. Ia hanya memastikan ada sesi yang sah.
 * Apakah sesi itu milik admin diputuskan ulang di layout dasbor dan, yang
 * menentukan, di awal setiap Server Action — lalu ditolak sekali lagi oleh RLS
 * seandainya kedua lapis itu dilewati.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  if (!isAdminPath(pathname)) {
    return NextResponse.next({ request: { headers } });
  }

  // Diimpor dinamis, bukan di puncak file: @supabase/ssr menyumbang sebagian
  // besar bundel middleware, dan impor statis memaksa modulnya dievaluasi pada
  // setiap permintaan yang cocok matcher — termasuk seluruh rute publik yang
  // tidak pernah menyentuh Supabase. Dengan cara ini biayanya hanya dibayar
  // permintaan yang benar-benar masuk ke /admin.
  const { readSession } = await import("@/lib/supabase/middleware");
  const { user, cookiesToSet } = await readSession(request);

  const mayPass = user !== null || pathname === LOGIN_PATH;

  const response = mayPass
    ? NextResponse.next({ request: { headers } })
    : NextResponse.redirect(loginRedirect(request));

  // Cookie hasil penyegaran harus menempel pada response yang benar-benar
  // dikembalikan — termasuk pada redirect, kalau tidak sesi yang baru
  // diperbarui hilang tepat saat dibutuhkan.
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  // Nilainya berasal dari pathname permintaan ini sendiri, jadi selalu satu
  // path relatif milik situs ini. Aksi masuk tetap memvalidasinya lagi sebelum
  // dipakai sebagai tujuan redirect — parameter query bisa dikarang siapa saja.
  url.searchParams.set("lanjut", request.nextUrl.pathname);
  return url;
}

export const config = {
  // Skip build output and static files — they never render a 404 page.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|webp|avif|svg|pdf)$).*)",
  ],
};
