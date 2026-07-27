"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin, type ActionResult, type GuardResult } from "@/lib/admin/guard";
import { publishNowDate } from "@/lib/admin/publish";
import { CoverError, MAX_COVER_BYTES, buildCoverPath, processCoverImage } from "@/lib/covers";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { validatePostForm, type PostFormInput } from "@/lib/validation";

/**
 * Seluruh mutasi artikel.
 *
 * Setiap action di file ini dibuka dengan `requireAdmin()`. Itu bukan
 * pengulangan yang bisa dihemat: Server Action adalah endpoint POST yang bisa
 * dijangkau publik, dan layout dasbor TIDAK dijalankan sebelum sebuah action.
 * Gate di layout hanya menyembunyikan tombol; baris pertama di sinilah batas
 * otorisasinya, dan RLS adalah lapis ketiga yang tetap menolak seandainya dua
 * lapis pertama dilepas seluruhnya.
 */

const TIDAK_BERWENANG = "Sesi Anda tidak lagi berwenang. Silakan masuk ulang.";

/** Menyegarkan setiap permukaan publik yang bisa berubah oleh satu mutasi. */
function revalidatePublic() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/blog", "page");
  revalidatePath("/[locale]/blog/[slug]", "page");
  revalidatePath("/[locale]/feed.xml", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
}

function readForm(formData: FormData): PostFormInput {
  const get = (name: string) => String(formData.get(name) ?? "");
  return {
    slug: get("slug"),
    categoryId: get("categoryId"),
    sourceLocale: get("sourceLocale"),
    publishedAtWib: get("publishedAtWib"),
    titleId: get("titleId"),
    titleEn: get("titleEn"),
    excerptId: get("excerptId"),
    excerptEn: get("excerptEn"),
    bodyId: get("bodyId"),
    bodyEn: get("bodyEn"),
    coverAltId: get("coverAltId"),
    coverAltEn: get("coverAltEn"),
  };
}

/**
 * Pernah publik = slug-nya pernah dipakai orang lain untuk menautkan.
 * Hanya artikel seperti itu yang penggantian slug-nya wajib dicatat; draft
 * yang belum pernah terbit tidak perlu membakar slug selamanya.
 */
function everWentLive(post: { status: string; published_at: string | null }): boolean {
  if (post.status !== "published" || !post.published_at) return false;
  return new Date(post.published_at).getTime() <= Date.now();
}

async function loadCategories(guard: Extract<GuardResult, { ok: true }>) {
  const { data } = await guard.supabase.from("categories").select("id");
  return (data ?? []).map((row) => row.id);
}

export async function saveArticle(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: guard.message };

  const withinLimit = await consumeRateLimit(
    `simpan:${guard.userId}`,
    RATE_LIMITS.save.limit,
    RATE_LIMITS.save.windowSeconds,
  );
  if (!withinLimit) {
    return { ok: false, message: "Terlalu banyak penyimpanan berturut-turut. Tunggu sebentar." };
  }

  const postId = String(formData.get("postId") ?? "").trim();
  const intent = String(formData.get("intent") ?? "draft");

  const validCategoryIds = await loadCategories(guard);
  const parsed = validatePostForm(readForm(formData), { validCategoryIds });
  if (!parsed.ok) {
    return { ok: false, message: "Ada isian yang belum benar.", fields: parsed.errors };
  }

  const value = parsed.value;

  // Menjadwalkan ke masa lalu bukan menjadwalkan — itu menerbitkan sekarang,
  // dengan tanggal yang menyesatkan pembaca.
  if (intent === "schedule") {
    if (!value.published_at) {
      return { ok: false, message: "Isi tanggal terbit dulu.", fields: { publishedAt: "Wajib diisi untuk menjadwalkan" } };
    }
    if (new Date(value.published_at).getTime() <= Date.now()) {
      return {
        ok: false,
        message: "Jadwal harus di masa depan.",
        fields: { publishedAt: "Pilih waktu yang belum lewat" },
      };
    }
  }

  const status = intent === "draft" ? "draft" : "published";
  const publishedAt = intent === "publish" ? publishNowDate(value.published_at) : value.published_at;

  // ------------------------------------------------------------ artikel baru
  if (!postId) {
    const { data, error } = await guard.supabase
      .from("posts")
      .insert({ ...value, status, published_at: publishedAt })
      .select("id")
      .single();

    if (error) return { ok: false, message: describeDbError(error, "simpan-artikel-baru") };

    revalidatePublic();
    redirect(`/admin/artikel/${data.id}?tersimpan=1`);
  }

  // ------------------------------------------------------------- artikel ada
  const { data: existing, error: loadError } = await guard.supabase
    .from("posts")
    .select("id, slug, status, published_at")
    .eq("id", postId)
    .maybeSingle();

  if (loadError) return { ok: false, message: describeDbError(loadError, "muat-artikel") };
  if (!existing) return { ok: false, message: "Artikel tidak ditemukan." };

  // Ganti slug lebih dulu dan lewat RPC, supaya URL lama tercatat untuk 301.
  // Update di bawah sengaja tidak menyertakan kolom slug — menulisnya langsung
  // akan melewati pencatatan itu tanpa memberi tanda apa pun.
  if (existing.slug !== value.slug) {
    if (everWentLive(existing)) {
      const { error } = await guard.supabase.rpc("rename_post_slug", {
        p_post_id: postId,
        p_new_slug: value.slug,
      });
      if (error) return { ok: false, message: describeDbError(error, "ganti-slug") };
    } else {
      const { error } = await guard.supabase
        .from("posts")
        .update({ slug: value.slug })
        .eq("id", postId);
      if (error) return { ok: false, message: describeDbError(error, "ganti-slug-draft") };
    }
  }

  // Kolom slug sengaja tidak ikut: penggantiannya sudah ditangani di atas,
  // dan menuliskannya lagi di sini akan melewati pencatatan riwayat.
  const { error } = await guard.supabase
    .from("posts")
    .update({
      category_id: value.category_id,
      source_locale: value.source_locale,
      title_id: value.title_id,
      title_en: value.title_en,
      excerpt_id: value.excerpt_id,
      excerpt_en: value.excerpt_en,
      body_id: value.body_id,
      body_en: value.body_en,
      cover_alt_id: value.cover_alt_id,
      cover_alt_en: value.cover_alt_en,
      status,
      published_at: publishedAt,
    })
    .eq("id", postId);

  if (error) return { ok: false, message: describeDbError(error, "simpan-artikel") };

  revalidatePublic();
  revalidatePath(`/admin/artikel/${postId}`);
  return { ok: true, message: "Tersimpan." };
}

/** Perubahan status kecil yang tidak menyentuh isi artikel. */
async function patchPost(
  postId: string,
  patch: TablesUpdate<"posts">,
  context: string,
  message: string,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: TIDAK_BERWENANG };
  if (!postId) return { ok: false, message: "Artikel tidak ditemukan." };

  const { error } = await guard.supabase.from("posts").update(patch).eq("id", postId);
  if (error) return { ok: false, message: describeDbError(error, context) };

  revalidatePublic();
  revalidatePath(`/admin/artikel/${postId}`);
  return { ok: true, message };
}

export async function markTranslationReviewed(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const postId = String(formData.get("postId") ?? "");
  return patchPost(
    postId,
    { translation_status: "reviewed" },
    "tandai-ditinjau",
    "Terjemahan ditandai sudah ditinjau.",
  );
}

/**
 * Tarik dari publik. `published_at` sengaja dibiarkan apa adanya: constraint
 * mengizinkan draft dengan tanggal terbit, jadi menerbitkan ulang nanti tetap
 * memakai tanggal aslinya alih-alih memalsukan artikel lama jadi baru.
 */
export async function unpublish(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const postId = String(formData.get("postId") ?? "");
  return patchPost(postId, { status: "draft" }, "tarik-dari-publik", "Artikel ditarik dari publik.");
}

export async function archivePost(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const postId = String(formData.get("postId") ?? "");
  return patchPost(
    postId,
    { deleted_at: new Date().toISOString() },
    "arsipkan",
    "Artikel dipindahkan ke arsip.",
  );
}

export async function restorePost(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const postId = String(formData.get("postId") ?? "");
  return patchPost(postId, { deleted_at: null }, "pulihkan", "Artikel dipulihkan dari arsip.");
}

/**
 * Hapus permanen — satu-satunya jalur yang benar-benar menghancurkan baris.
 *
 * Hanya tersedia untuk artikel yang sudah di arsip, dan mensyaratkan slug-nya
 * diketik ulang. Ini jalan keluar untuk tiga artikel [DUMMY] (K8); di luar itu
 * artikel di-unpublish atau diarsipkan, tidak pernah dihapus.
 */
export async function deletePostPermanently(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: TIDAK_BERWENANG };

  const postId = String(formData.get("postId") ?? "").trim();
  const konfirmasi = String(formData.get("konfirmasiSlug") ?? "").trim();

  const { data: post, error: loadError } = await guard.supabase
    .from("posts")
    .select("slug, deleted_at, cover_path")
    .eq("id", postId)
    .maybeSingle();

  if (loadError) return { ok: false, message: describeDbError(loadError, "muat-hapus") };
  if (!post) return { ok: false, message: "Artikel tidak ditemukan." };

  if (!post.deleted_at) {
    return { ok: false, message: "Arsipkan artikel ini dulu sebelum menghapusnya permanen." };
  }
  if (konfirmasi !== post.slug) {
    return {
      ok: false,
      message: "Slug yang diketik tidak cocok.",
      fields: { konfirmasiSlug: `Ketik persis: ${post.slug}` },
    };
  }

  const { error } = await guard.supabase.from("posts").delete().eq("id", postId);
  if (error) return { ok: false, message: describeDbError(error, "hapus-permanen") };

  // Berkas cover ikut dibersihkan hanya kalau ia memang ada di Storage. Cover
  // dummy menunjuk ke public/blog-covers/ dengan garis miring di depan dan
  // bukan objek Storage — memanggil remove() untuk itu hanya gagal diam-diam.
  if (post.cover_path && !post.cover_path.startsWith("/") && !post.cover_path.startsWith("http")) {
    await guard.supabase.storage.from("post-covers").remove([post.cover_path]);
  }

  revalidatePublic();
  redirect("/admin?tab=archived");
}

const PESAN_COVER: Record<string, string> = {
  "too-large": "Berkas lebih dari 5 MB.",
  "not-an-image": "Berkas ini bukan gambar.",
  "unsupported-format": "Format tidak didukung — pakai JPEG, PNG, WebP, atau AVIF.",
  "too-small": "Lebar gambar minimal 600 piksel.",
};

export async function uploadCover(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: TIDAK_BERWENANG };

  const withinLimit = await consumeRateLimit(
    `unggah-cover:${guard.userId}`,
    RATE_LIMITS.coverUpload.limit,
    RATE_LIMITS.coverUpload.windowSeconds,
  );
  // sharp memakai CPU dengan sungguh-sungguh; batas ini menjaga fungsi dari
  // membebani dirinya sendiri, bukan menjaga dari orang luar.
  if (!withinLimit) {
    return { ok: false, message: "Terlalu banyak unggahan. Coba lagi dalam satu jam." };
  }

  const postId = String(formData.get("postId") ?? "").trim();
  const file = formData.get("cover");

  if (!postId) return { ok: false, message: "Simpan artikel dulu sebelum mengunggah cover." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pilih berkas gambar dulu." };
  }

  // Ditolak lebih awal supaya 5 MB tidak perlu dibaca ke memori hanya untuk
  // kemudian dilempar.
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, message: PESAN_COVER["too-large"]! };
  }

  const { data: post, error: loadError } = await guard.supabase
    .from("posts")
    .select("slug, cover_path")
    .eq("id", postId)
    .maybeSingle();

  if (loadError) return { ok: false, message: describeDbError(loadError, "muat-cover") };
  if (!post) return { ok: false, message: "Artikel tidak ditemukan." };

  let processed;
  try {
    processed = await processCoverImage(await file.arrayBuffer());
  } catch (err) {
    if (err instanceof CoverError) {
      return { ok: false, message: PESAN_COVER[err.reason] ?? "Gambar tidak bisa diproses." };
    }
    console.error("[unggah-cover] gagal diproses:", err);
    return { ok: false, message: "Gambar tidak bisa diproses." };
  }

  const path = buildCoverPath(post.slug);
  const { error: uploadError } = await guard.supabase.storage
    .from("post-covers")
    .upload(path, processed.data, { contentType: processed.contentType, upsert: false });

  if (uploadError) {
    console.error("[unggah-cover] storage:", uploadError.message);
    return { ok: false, message: "Gagal mengunggah ke penyimpanan." };
  }

  const { error: updateError } = await guard.supabase
    .from("posts")
    .update({ cover_path: path })
    .eq("id", postId);

  if (updateError) {
    // Baris gagal diperbarui: objek yang baru diunggah jadi yatim, jadi buang
    // lagi daripada meninggalkan sampah yang tidak dirujuk siapa pun.
    await guard.supabase.storage.from("post-covers").remove([path]);
    return { ok: false, message: describeDbError(updateError, "simpan-cover") };
  }

  // Baru setelah baris menunjuk ke cover baru, cover lama boleh dibuang —
  // urutan sebaliknya menyisakan artikel tanpa gambar bila update gagal.
  const lama = post.cover_path;
  if (lama && !lama.startsWith("/") && !lama.startsWith("http") && lama !== path) {
    await guard.supabase.storage.from("post-covers").remove([lama]);
  }

  revalidatePublic();
  revalidatePath(`/admin/artikel/${postId}`);
  return { ok: true, message: "Cover diperbarui." };
}
