import "server-only";

import { createHash } from "node:crypto";
import { createRpcClient } from "@/lib/supabase/rpc";

/**
 * Pembatas laju (competency 28).
 *
 * Penghitungnya ada di Postgres, bukan di memori proses: fungsi serverless
 * Vercel berumur pendek dan tidak berbagi memori antar instance, jadi Map
 * in-memory akan mereset diri setiap cold start dan praktis tidak membatasi
 * apa pun. Redis melanggar postur $0/bulan; Supabase sudah ada dan gratis.
 *
 * Seluruh logikanya ada di `consume_rate_limit()` (migrasi 0005) — satu
 * pernyataan atomik, satu perjalanan pulang-pergi.
 */

/**
 * Salt opsional. Tanpa salt, sha256 dari sebuah alamat IPv4 bisa dibalik
 * dengan mencoba seluruh ruang alamat — jadi kolom `bucket` hanya menyamarkan,
 * bukan menganonimkan. Tabelnya sendiri tidak punya policy RLS dan karenanya
 * tidak terbaca lewat REST oleh siapa pun, dan barisnya dihapus setelah sehari,
 * jadi ketiadaan salt bukan lubang — hanya pertahanan berlapis yang hilang.
 */
const SALT = process.env.RATE_LIMIT_SALT ?? "";

export function bucketKey(purpose: string, value: string): string {
  const digest = createHash("sha256").update(`${purpose}:${value}:${SALT}`).digest("hex");
  return `${purpose}:${digest.slice(0, 32)}`;
}

/**
 * Alamat pemanggil menurut `x-forwarded-for`.
 *
 * Header ini bisa dipalsukan pada umumnya, tapi tidak di belakang Vercel: edge
 * network menimpanya dengan alamat koneksi yang sebenarnya sebelum permintaan
 * sampai ke fungsi. Kalau hosting-nya pindah, asumsi ini harus ditinjau ulang.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "tidak-diketahui";
}

/**
 * Menambah satu hit pada bucket. `true` berarti masih boleh lanjut.
 *
 * Bila databasenya sendiri yang gagal, hasilnya `true` — pembatas laju tidak
 * boleh menjadi alasan seluruh dasbor berhenti bekerja. Konsekuensinya
 * disadari: saat Supabase tumbang, tidak ada pembatasan. Yang dilindungi di
 * sini adalah penyalahgunaan, bukan ketersediaan.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = createRpcClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("consume_rate_limit gagal:", error.message);
    return true;
  }

  return data === true;
}

/** Batas yang dipakai dasbor. Dikumpulkan di sini agar mudah ditinjau bersama. */
export const RATE_LIMITS = {
  loginPerIp: { limit: 10, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 5, windowSeconds: 15 * 60 },
  coverUpload: { limit: 20, windowSeconds: 60 * 60 },
  save: { limit: 120, windowSeconds: 60 * 60 },
} as const;
