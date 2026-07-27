/**
 * Pembuat dan pemeriksa slug artikel.
 *
 * Slug adalah janji: begitu sebuah URL terbit, ia dipakai orang lain untuk
 * menautkan dan diindeks mesin pencari. Karena itu penggantian slug selalu
 * lewat `rename_post_slug()` yang mencatat slug lama untuk redirect 301 —
 * tidak pernah lewat `update posts set slug = ...` langsung.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MIN = 3;
export const SLUG_MAX = 80;

/**
 * Slug yang akan bertabrakan dengan rute yang sudah ada atau dengan segmen
 * dasbor. `/[locale]/blog/[slug]` memang tidak memuat rute-rute ini, tapi
 * membiarkannya terpakai hanya menyimpan kebingungan untuk nanti.
 */
const RESERVED = new Set([
  "admin",
  "api",
  "baru",
  "blog",
  "en",
  "feed",
  "feed.xml",
  "id",
  "masuk",
  "robots.txt",
  "sitemap.xml",
]);

/** Teks bebas -> slug. Diakritik diluruhkan, bukan dibuang jadi tanda hubung. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");

  // Judul yang seluruhnya non-latin bisa menghasilkan string kosong. Slug
  // kosong akan menabrak constraint NOT NULL jauh dari tempat penyebabnya,
  // jadi berikan sesuatu yang sah dan bisa diubah sendiri oleh penulisnya.
  if (base.length < SLUG_MIN) {
    return `artikel-${Math.random().toString(16).slice(2, 8)}`;
  }

  return base;
}

export function slugError(value: string): string | null {
  const slug = value.trim();

  if (slug.length === 0) return "Slug wajib diisi";
  if (slug.length < SLUG_MIN) return `Slug minimal ${SLUG_MIN} karakter`;
  if (slug.length > SLUG_MAX) return `Slug maksimal ${SLUG_MAX} karakter`;
  if (!SLUG_PATTERN.test(slug)) {
    return "Slug hanya boleh huruf kecil, angka, dan tanda hubung tunggal";
  }
  if (RESERVED.has(slug)) return "Slug ini dipakai sistem, pilih yang lain";

  return null;
}
