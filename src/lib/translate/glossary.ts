import "server-only";

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
