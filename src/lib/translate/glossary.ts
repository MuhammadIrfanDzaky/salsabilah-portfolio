import "server-only";

import { GLOSSARY_TAG } from "./config";

/**
 * Glosarium istilah teknis (K2).
 *
 * K2 tidak berhenti pada "sebutkan glosarium di prompt". Bunyinya: glosarium
 * **diverifikasi terhadap output, bukan sekadar dipercaya ada di prompt**.
 * Model bisa mengabaikan instruksi, dan model gratis lebih sering begitu — jadi
 * pemeriksaan di sini adalah yang benar-benar menegakkan aturannya.
 */

export type GlossaryTerm = { term: string; note: string | null };

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apakah `haystack` memuat istilah ini sebagai kata utuh?
 *
 * Batas kata perlu karena glosarium memuat singkatan pendek seperti `RCA` dan
 * `CMS`. Tanpa batas, `RCA` akan cocok di dalam kata lain dan pemeriksaannya
 * jadi tidak berarti.
 */
export function containsTerm(haystack: string, term: string): boolean {
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeForRegex(term)}(?![\\p{L}\\p{N}])`,
    "iu",
  );
  return pattern.test(haystack);
}

/** Istilah glosarium yang benar-benar muncul di teks sumber. */
export function termsPresentIn(terms: readonly GlossaryTerm[], source: string): GlossaryTerm[] {
  return terms.filter((entry) => containsTerm(source, entry.term));
}

/**
 * Istilah yang ada di sumber tapi hilang dari terjemahan.
 *
 * Daftar tak kosong berarti model menerjemahkan sesuatu yang seharusnya
 * dibiarkan utuh — terjemahannya ditolak, bukan disimpan dengan peringatan.
 */
export function missingTerms(
  terms: readonly GlossaryTerm[],
  source: string,
  translated: string,
): string[] {
  return termsPresentIn(terms, source)
    .filter((entry) => !containsTerm(translated, entry.term))
    .map((entry) => entry.term);
}

/**
 * Membungkus istilah glosarium dengan tag yang diabaikan DeepL.
 *
 * Ini pengganti "sebutkan glosarium di prompt". Bedanya bukan gaya: prompt
 * adalah permintaan yang boleh diabaikan mesin, sedangkan `ignore_tags` adalah
 * aturan yang ditegakkan penerjemahnya sendiri. Pelanggaran glosarium karena
 * itu **dicegah**, bukan ditangkap sesudah rusak.
 *
 * `missingTerms()` di atas tetap dipanggil sesudahnya. Bukan pengulangan: yang
 * satu mengatur mesin, yang satu memeriksa hasilnya — dan K2 menuntut yang
 * kedua secara eksplisit.
 */
export function protectTerms(text: string, terms: readonly GlossaryTerm[]): string {
  const relevan = termsPresentIn(terms, text);
  if (relevan.length === 0) return text;

  // Terpanjang lebih dulu, supaya istilah yang memuat istilah lain tidak
  // terpotong jadi dua pembungkus bersarang.
  const pola = relevan
    .map((entry) => entry.term)
    .sort((a, b) => b.length - a.length)
    .map(escapeForRegex)
    .join("|");

  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${pola})(?![\\p{L}\\p{N}])`, "giu");
  return text.replace(re, `<${GLOSSARY_TAG}>$1</${GLOSSARY_TAG}>`);
}

/**
 * Menyiapkan teks untuk mode XML DeepL.
 *
 * Wajib dijalankan **sebelum** `protectTerms`, kalau tidak tag pembungkusnya
 * ikut ter-escape dan berubah jadi teks biasa — dan perlindungannya diam-diam
 * tidak berlaku, tanpa satu pun galat.
 */
export function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Membuang pembungkus glosarium dan mengembalikan karakter yang ter-escape. */
export function stripProtection(text: string): string {
  return text
    .replace(new RegExp(`</?${GLOSSARY_TAG}\\s*/?>`, "gi"), "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // `&amp;` terakhir, supaya `&amp;lt;` tidak berubah jadi `<`.
    .replace(/&amp;/g, "&");
}
