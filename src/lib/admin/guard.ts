import "server-only";

import { createSessionClient } from "@/lib/supabase/server";
import type { FieldErrors } from "@/lib/validation";

/**
 * Batas otorisasi dasbor (competency 26).
 *
 * Layout `(dasbor)` memang memeriksa sesi, tapi itu kenyamanan tampilan, bukan
 * pengamanan: Server Action adalah endpoint POST yang bisa dijangkau publik,
 * dan layout TIDAK dijalankan sebelum sebuah action. Karena itu setiap action
 * membuka dirinya dengan `requireAdmin()` — memeriksa ulang sesi dan
 * memanggil ulang `is_admin()`.
 *
 * Tiga lapis, dan yang ketiga tidak bergantung pada kode ini sama sekali:
 *   1. layout dasbor  — pengunjung anonim tidak melihat halamannya
 *   2. requireAdmin() — action menolak pemanggil yang tidak berwenang
 *   3. RLS Supabase   — database menolak penulisannya meski dua lapis di atas
 *                       dilepas seluruhnya
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fields?: FieldErrors };

export type AdminSession = Awaited<ReturnType<typeof createSessionClient>>;

export type GuardResult =
  | { ok: true; supabase: AdminSession; userId: string }
  | { ok: false; message: string };

export const PESAN_TIDAK_BERWENANG = "Sesi Anda tidak lagi berwenang. Silakan masuk ulang.";

export async function requireAdmin(): Promise<GuardResult> {
  const supabase = await createSessionClient();

  // getUser(), bukan getSession(): yang pertama memvalidasi token ke server
  // auth, yang kedua percaya begitu saja pada isi cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: PESAN_TIDAK_BERWENANG };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return { ok: false, message: PESAN_TIDAK_BERWENANG };

  return { ok: true, supabase, userId: user.id };
}

/**
 * Membersihkan parameter `lanjut` sebelum dipakai sebagai tujuan redirect.
 *
 * Nilainya memang dibuat middleware dari path permintaan sendiri, tapi ia
 * melewati URL dan karenanya bisa diganti siapa pun. Tanpa pemeriksaan ini,
 * `/admin/masuk?lanjut=https://situs-lain` mengubah halaman masuk jadi open
 * redirect — modal yang rapi untuk phishing.
 */
export function safeNextPath(value: string | undefined): string {
  if (!value) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}
