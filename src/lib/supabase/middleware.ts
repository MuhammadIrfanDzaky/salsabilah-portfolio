import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/**
 * Pembaca sesi khusus middleware.
 *
 * Sengaja TIDAK memakai `createSessionClient()` dari `./server`: file itu
 * diawali `import "server-only"` dan bergantung pada `cookies()` dari
 * `next/headers`, dua hal yang tidak tersedia di runtime middleware. `./env`
 * aman diimpor karena tidak memuat rahasia apa pun — hanya URL dan kunci
 * publishable yang memang boleh sampai ke browser.
 *
 * Kenapa middleware perlu ikut campur sama sekali: access token Supabase
 * berumur satu jam, dan yang memperbaruinya adalah pemanggilan `getUser()`
 * yang menuliskan cookie baru. Server Component tidak boleh menulis cookie,
 * jadi tanpa langkah ini Salsabilah akan terlempar keluar setiap jam meski
 * refresh token-nya masih sah.
 */
export type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Mengembalikan pengguna yang sedang masuk beserta cookie hasil penyegaran.
 *
 * Cookie-nya dikumpulkan, bukan langsung ditulis, karena pemanggil belum tentu
 * mengembalikan response yang sama: permintaan yang tidak berwenang berakhir
 * sebagai redirect, dan cookie yang terlanjur ditempel pada response lain akan
 * hilang begitu saja — sesi yang baru disegarkan ikut hangus bersamanya.
 */
export async function readSession(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(incoming) {
        cookiesToSet.push(...incoming);
      },
    },
  });

  // getUser(), bukan getSession(): yang pertama memvalidasi token ke server
  // auth, yang kedua percaya begitu saja pada isi cookie. Untuk keputusan
  // otorisasi, bedanya menentukan.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, cookiesToSet };
}
