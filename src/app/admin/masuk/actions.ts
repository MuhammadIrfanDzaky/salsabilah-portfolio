"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminCopy } from "@/data/admin-copy";
import { safeNextPath, type ActionResult } from "@/lib/admin/guard";
import { RATE_LIMITS, bucketKey, clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Masuk dijalankan sebagai Server Action, bukan lewat klien browser Supabase.
 *
 * Tiga alasan:
 *   1. Formulirnya tetap berfungsi tanpa JavaScript.
 *   2. Kata sandi tidak pernah perlu ditangani bundel klien.
 *   3. Pembatas laju berjalan SEBELUM kredensialnya sampai ke GoTrue — kalau
 *      pemeriksaannya di klien, penyerang tinggal melewatinya.
 */
export async function signIn(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("lanjut") ?? ""));

  if (!email || !password) {
    return { ok: false, message: adminCopy.login.incomplete };
  }

  // Dua bucket, dua sudut serangan yang berbeda: satu alamat yang mencoba
  // banyak kata sandi, dan banyak alamat yang mencoba satu akun.
  const ip = clientIp(await headers());
  const perIp = await consumeRateLimit(
    bucketKey("masuk-ip", ip),
    RATE_LIMITS.loginPerIp.limit,
    RATE_LIMITS.loginPerIp.windowSeconds,
  );
  const perEmail = await consumeRateLimit(
    bucketKey("masuk-email", email),
    RATE_LIMITS.loginPerEmail.limit,
    RATE_LIMITS.loginPerEmail.windowSeconds,
  );

  if (!perIp || !perEmail) {
    return { ok: false, message: adminCopy.login.rateLimited };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesannya sengaja sama untuk email tak dikenal dan kata sandi salah:
    // membedakannya memberi tahu penebak bahwa sebuah alamat email terdaftar.
    console.error("[masuk] gagal:", error.message);
    return { ok: false, message: adminCopy.login.failed };
  }

  // Punya sesi belum berarti berwenang. Akun yang tidak terdaftar di
  // admin_users tidak boleh membawa sesi yang menganggur di browser.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, message: adminCopy.login.notAdmin };
  }

  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/masuk");
}
