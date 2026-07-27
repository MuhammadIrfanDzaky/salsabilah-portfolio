import { slugError } from "@/lib/slug";
import { wibToUtcIso } from "@/lib/time";
import type { Locale } from "@/lib/i18n";

/**
 * Validasi sisi server untuk formulir artikel (competency 18).
 *
 * Ditulis tangan, tanpa dependensi baru: `npm audit --omit=dev` project ini
 * bersih di angka 0 (competency 30), dan menambah satu paket demi sepuluh
 * pemeriksaan panjang string adalah harga yang tidak sepadan.
 *
 * Yang dikirim formulir tidak pernah dipercaya — termasuk `category_id`, yang
 * datang dari <select> dan karenanya bisa diganti isinya oleh siapa pun yang
 * mengirim POST sendiri. Nilainya dicocokkan ulang dengan daftar kategori yang
 * diambil server, bukan sekadar diperiksa bentuknya.
 */

export type FieldErrors = Record<string, string>;

export const LIMITS = {
  title: 160,
  excerpt: 300,
  body: 50_000,
  coverAlt: 160,
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Membuang karakter kontrol C0/C1, kecuali baris baru dan tab yang memang
 * bagian sah dari isi artikel. Ditulis sebagai perulangan, bukan kelas karakter
 * regex, supaya rentangnya terbaca sebagai angka dan tidak berubah diam-diam
 * saat file ini disalin antar-alat.
 */
function stripControlChars(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f);
    if (!isControl || ch === "\n" || ch === "\t") out += ch;
  }
  return out;
}


/**
 * Normalisasi teks sebelum apa pun lain menyentuhnya.
 *
 * NFC supaya "é" yang diketik sebagai satu karakter dan sebagai e + aksen
 * tergabung tidak dihitung berbeda oleh pencarian full-text. Karakter kontrol
 * dibuang kecuali baris baru dan tab — sisanya tidak pernah disengaja dan
 * hanya menyulitkan saat muncul lagi di keluaran.
 */
export function cleanText(value: string): string {
  const normalized = value.normalize("NFC").replace(/\r\n?/g, "\n");
  return stripControlChars(normalized).trim();
}

function checkLength(
  errors: FieldErrors,
  field: string,
  value: string,
  max: number,
  { required = false, label }: { required?: boolean; label: string },
) {
  if (required && value.length === 0) {
    errors[field] = `${label} wajib diisi`;
    return;
  }
  if (value.length > max) {
    errors[field] = `${label} maksimal ${max.toLocaleString("id-ID")} karakter`;
  }
}

export type PostFormInput = {
  slug: string;
  categoryId: string;
  sourceLocale: string;
  publishedAtWib: string;
  titleId: string;
  titleEn: string;
  excerptId: string;
  excerptEn: string;
  bodyId: string;
  bodyEn: string;
  coverAltId: string;
  coverAltEn: string;
};

export type ParsedPost = {
  slug: string;
  category_id: string;
  source_locale: Locale;
  published_at: string | null;
  title_id: string;
  title_en: string;
  excerpt_id: string;
  excerpt_en: string;
  body_id: string;
  body_en: string;
  cover_alt_id: string;
  cover_alt_en: string;
};

export type ValidationResult =
  | { ok: true; value: ParsedPost }
  | { ok: false; errors: FieldErrors };

export function validatePostForm(
  input: PostFormInput,
  options: { validCategoryIds: readonly string[] },
): ValidationResult {
  const errors: FieldErrors = {};

  const slug = input.slug.trim().toLowerCase();
  const slugProblem = slugError(slug);
  if (slugProblem) errors.slug = slugProblem;

  const categoryId = input.categoryId.trim();
  if (!UUID.test(categoryId) || !options.validCategoryIds.includes(categoryId)) {
    errors.categoryId = "Kategori tidak dikenal";
  }

  const sourceLocale = input.sourceLocale.trim();
  if (sourceLocale !== "id" && sourceLocale !== "en") {
    errors.sourceLocale = "Bahasa sumber harus id atau en";
  }

  // Boleh kosong selama artikel masih draft; syarat "wajib ada saat terbit"
  // ditegakkan constraint di database, bukan di sini.
  let publishedAt: string | null = null;
  const rawPublished = input.publishedAtWib.trim();
  if (rawPublished.length > 0) {
    publishedAt = wibToUtcIso(rawPublished);
    if (!publishedAt) errors.publishedAt = "Tanggal terbit tidak valid";
  }

  const titleId = cleanText(input.titleId);
  const titleEn = cleanText(input.titleEn);
  const excerptId = cleanText(input.excerptId);
  const excerptEn = cleanText(input.excerptEn);
  const bodyId = cleanText(input.bodyId);
  const bodyEn = cleanText(input.bodyEn);
  const coverAltId = cleanText(input.coverAltId);
  const coverAltEn = cleanText(input.coverAltEn);

  checkLength(errors, "titleId", titleId, LIMITS.title, { label: "Judul (ID)" });
  checkLength(errors, "titleEn", titleEn, LIMITS.title, { label: "Judul (EN)" });
  checkLength(errors, "excerptId", excerptId, LIMITS.excerpt, { label: "Ringkasan (ID)" });
  checkLength(errors, "excerptEn", excerptEn, LIMITS.excerpt, { label: "Ringkasan (EN)" });
  checkLength(errors, "bodyId", bodyId, LIMITS.body, { label: "Isi (ID)" });
  checkLength(errors, "bodyEn", bodyEn, LIMITS.body, { label: "Isi (EN)" });
  checkLength(errors, "coverAltId", coverAltId, LIMITS.coverAlt, { label: "Alt cover (ID)" });
  checkLength(errors, "coverAltEn", coverAltEn, LIMITS.coverAlt, { label: "Alt cover (EN)" });

  // Artikel tanpa judul di bahasa sumbernya tidak punya apa pun untuk
  // ditampilkan di daftar dasbor, jadi ini satu-satunya isi yang diwajibkan
  // sejak tahap draft.
  if (sourceLocale === "id" && titleId.length === 0) {
    errors.titleId = "Judul (ID) wajib diisi karena bahasa sumbernya Indonesia";
  }
  if (sourceLocale === "en" && titleEn.length === 0) {
    errors.titleEn = "Judul (EN) wajib diisi karena bahasa sumbernya Inggris";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      slug,
      category_id: categoryId,
      source_locale: sourceLocale as Locale,
      published_at: publishedAt,
      title_id: titleId,
      title_en: titleEn,
      excerpt_id: excerptId,
      excerpt_en: excerptEn,
      body_id: bodyId,
      body_en: bodyEn,
      cover_alt_id: coverAltId,
      cover_alt_en: coverAltEn,
    },
  };
}

/** Syarat K2 yang sama persis dengan CHECK constraint di database. */
export function publishBlockers(post: {
  title_id: string | null;
  title_en: string | null;
  body_id: string | null;
  body_en: string | null;
  cover_path: string | null;
  published_at: string | null;
  translation_status: string;
}): string[] {
  const kurang: string[] = [];
  if (!post.title_id?.trim()) kurang.push("Judul (ID)");
  if (!post.title_en?.trim()) kurang.push("Judul (EN)");
  if (!post.body_id?.trim()) kurang.push("Isi (ID)");
  if (!post.body_en?.trim()) kurang.push("Isi (EN)");
  if (!post.cover_path?.trim()) kurang.push("Cover");
  if (!post.published_at) kurang.push("Tanggal terbit");
  if (post.translation_status !== "reviewed") kurang.push("Terjemahan ditinjau");
  return kurang;
}
