import "server-only";

/**
 * Menerjemahkan kegagalan database jadi kalimat yang bisa ditindaklanjuti.
 *
 * Dua alasan, keduanya penting:
 *   1. Pesan Postgres mentah membocorkan nama tabel, kolom, dan constraint —
 *      peta skema gratis bagi siapa pun yang memancing error.
 *   2. "new row violates check constraint
 *      posts_publish_requires_reviewed_bilingual" tidak memberi tahu Salsabilah
 *      apa yang harus dia lakukan. "Belum semua syarat terbit terpenuhi" iya.
 *
 * Yang aslinya tidak dibuang, hanya dipindahkan: selalu tercatat di log server.
 */

type SupabaseLikeError = { code?: string; message?: string; details?: string | null };

const BY_CODE: Record<string, string> = {
  // unique_violation
  "23505": "Slug itu sudah dipakai artikel lain. Pilih slug yang berbeda.",
  // check_violation — di tabel posts praktis selalu gate terbit K2
  "23514": "Belum semua syarat terbit terpenuhi. Periksa daftar di atas tombol terbit.",
  // foreign_key_violation
  "23503": "Kategori yang dipilih sudah tidak ada.",
  // not_null_violation
  "23502": "Ada isian wajib yang masih kosong.",
  // insufficient_privilege
  "42501": "Sesi Anda tidak lagi berwenang. Silakan masuk ulang.",
  // PostgREST: JWT kedaluwarsa atau tidak sah
  PGRST301: "Sesi Anda sudah berakhir. Silakan masuk ulang.",
  // PostgREST: hasil tunggal diminta tapi tidak ada barisnya
  PGRST116: "Artikel tidak ditemukan.",
};

export function describeDbError(error: SupabaseLikeError, context: string): string {
  console.error(`[${context}]`, error.code ?? "-", error.message ?? "", error.details ?? "");

  const known = error.code ? BY_CODE[error.code] : undefined;
  if (known) return known;

  return "Terjadi kesalahan saat menyimpan. Coba lagi sebentar lagi.";
}
