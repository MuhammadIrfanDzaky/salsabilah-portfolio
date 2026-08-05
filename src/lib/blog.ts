import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { resolveImageSrc } from "@/lib/storage-url";
import type { Locale } from "@/lib/i18n";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Read side of the blog.
 *
 * Every query here runs with the publishable key, so Row Level Security is
 * what decides visibility: `posts_public_read` only matches rows that are
 * published, not soft-deleted, and whose `published_at` has already passed.
 * That means a scheduled post cannot leak through a forgotten `.eq()` — the
 * filter lives in the database, not in this file.
 */

export type PostRow = Tables<"posts">;
export type CategoryRow = Tables<"categories">;

/** Fields the listing needs — deliberately excludes the (large) body columns. */
const LIST_COLUMNS =
  "slug, published_at, like_count, cover_path, cover_alt_id, cover_alt_en, title_id, title_en, excerpt_id, excerpt_en, category_id";

export type PostListItem = Pick<
  PostRow,
  | "slug"
  | "published_at"
  | "like_count"
  | "cover_path"
  | "cover_alt_id"
  | "cover_alt_en"
  | "title_id"
  | "title_en"
  | "excerpt_id"
  | "excerpt_en"
  | "category_id"
>;

/**
 * Seed rows store a leading-slash path pointing at `public/`; real uploads
 * store a Supabase Storage key. Distinguishing on the leading slash keeps the
 * dummy content working without a second column.
 *
 * Dua hal yang sengaja berbeda dari pemanggil `resolveImageSrc()` lainnya:
 *
 *   1. `SUPABASE_URL` di sini datang dari `@/lib/supabase/env`, yang MELEMPAR
 *      bila variabelnya kosong — bukan `BROWSER_SUPABASE_URL` yang diam. File
 *      ini `server-only`, jadi gagal keras saat start adalah yang benar
 *      (kompetensi #29); yang tidak boleh gagal keras hanya kode yang ikut ke
 *      peramban.
 *   2. Tanda tangannya menerima dan mengembalikan `null`, karena `cover_path`
 *      memang nullable di database. Artikel tanpa cover bukan kesalahan.
 *
 * Yang berubah saat disatukan: nilai berawalan `blob:` kini ikut dilewatkan apa
 * adanya. Itu memperluas guard, bukan mempersempitnya, dan tidak mengubah
 * perilaku nyata — `blob:` hanya ada di peramban sebelum unggahan selesai dan
 * tidak pernah tersimpan sebagai `cover_path`.
 */
export function coverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null;
  return resolveImageSrc(SUPABASE_URL, coverPath);
}

export function localized<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: Locale,
): string {
  const value = row[`${field}_${locale}`];
  return typeof value === "string" ? value : "";
}

export async function listCategories(): Promise<CategoryRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return data ?? [];
}

/**
 * K7: the blog entry point stays hidden until the first article is actually
 * live, so visitors never meet an empty section.
 */
export async function hasPublishedPosts(): Promise<boolean> {
  const supabase = createPublicClient();
  const { count, error } = await supabase
    .from("posts")
    .select("slug", { count: "exact", head: true });
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function listPosts(options: {
  locale: Locale;
  categorySlug?: string;
  query?: string;
  limit?: number;
}): Promise<PostListItem[]> {
  const supabase = createPublicClient();
  let builder = supabase.from("posts").select(LIST_COLUMNS);

  if (options.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();
    // An unknown category must yield nothing rather than silently everything.
    if (!category) return [];
    builder = builder.eq("category_id", category.id);
  }

  const term = options.query?.trim();
  if (term) {
    // Postgres full-text search against the generated tsvector, not LIKE '%x%'
    // (competency 21). 'websearch' accepts quotes and OR the way readers type.
    builder = builder.textSearch(options.locale === "id" ? "search_id" : "search_en", term, {
      type: "websearch",
    });
  }

  const { data, error } = await builder
    .order("published_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (error) throw new Error(`Gagal memuat artikel: ${error.message}`);
  return (data ?? []) as PostListItem[];
}

export async function getPostBySlug(slug: string): Promise<PostRow | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Gagal memuat artikel: ${error.message}`);
  return data;
}

/** Slugs that used to belong to a post, so old links can be redirected. */
export async function resolveRenamedSlug(oldSlug: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("post_slug_history")
    .select("post_id")
    .eq("old_slug", oldSlug)
    .maybeSingle();
  if (!data) return null;

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", data.post_id)
    .maybeSingle();
  return post?.slug ?? null;
}

/** Slugs for generateStaticParams — only live posts have a page. */
export async function listPublishedSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("posts").select("slug");
  if (error) return [];
  return (data ?? []).map((row) => row.slug);
}

/** Stored UTC, always shown in the reader's locale (competency 12). */
export function formatPublishedAt(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** Rough reading time; 200 wpm is the usual convention for prose. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
