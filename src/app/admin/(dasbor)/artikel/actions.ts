"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin, type ActionResult, type GuardResult } from "@/lib/admin/guard";
import { publishNowDate } from "@/lib/admin/publish";
import {
  COVER_MIN_WIDTH,
  CoverError,
  type CoverErrorDetail,
  type CoverProcessingError,
  MAX_COVER_BYTES,
  buildBodyImagePath,
  buildCoverPath,
  processCoverImage,
} from "@/lib/covers";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { IMAGE_BUCKET, isOwnedStoragePath } from "@/lib/storage-url";
import type { Locale } from "@/lib/i18n";
import { translateArticle, type TranslateDeps } from "@/lib/translate";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";
import { validatePostForm, type PostFormInput } from "@/lib/validation";
import { sanitizeDoc, docToPlainText, collectImagePaths, type Doc } from "@/lib/doc";

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

/**
 * Dokumen isi dari formulir, sudah dibersihkan.
 *
 * Dibersihkan DI SINI, di server, meski editor juga membersihkannya di
 * peramban. Yang di peramban itu kenyamanan; yang menentukan adalah ini —
 * `docId` datang sebagai string JSON di dalam FormData, dan apa pun bisa
 * dikirim ke sebuah Server Action.
 */
function readDocs(formData: FormData): { id: Doc; en: Doc } {
  return {
    id: sanitizeDoc(String(formData.get("docId") ?? "")),
    en: sanitizeDoc(String(formData.get("docEn") ?? "")),
  };
}

/**
 * Dokumen → nilai kolom jsonb.
 *
 * `Doc` memakai `Record<string, unknown>` untuk `attrs` supaya `sanitizeDoc()`
 * bisa memeriksa isinya tanpa berasumsi; `Json` menuntut bentuk yang lebih
 * sempit. Konversinya aman justru karena dokumennya baru saja dibersihkan —
 * setelah `sanitizeDoc()`, satu-satunya nilai yang tersisa adalah string,
 * angka, dan objek/array dari keduanya.
 */
function toJson(doc: Doc): Json {
  return doc as unknown as Json;
}

function readForm(formData: FormData, docs: { id: Doc; en: Doc }): PostFormInput {
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
    // Cermin teks polos diturunkan dari dokumen, bukan dibaca dari formulir.
    // Membacanya terpisah berarti keduanya bisa berbeda, dan pencarian akan
    // menemukan kata yang sudah tidak ada di artikelnya.
    bodyId: docToPlainText(docs.id),
    bodyEn: docToPlainText(docs.en),
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

  // Cover kini ikut dalam pengiriman formulir, bukan formulir terpisah, supaya
  // gambarnya bisa dipilih sejak layar artikel baru. Diunggah setelah barisnya
  // ada — sebelum itu tidak ada slug untuk menyusun nama berkasnya.
  const coverFile = formData.get("cover");
  const coverBaru = coverFile instanceof File && coverFile.size > 0 ? coverFile : null;

  const docs = readDocs(formData);

  /*
   * Tanda "terjemahan sudah ditinjau" ikut formulir, bukan lewat action sendiri.
   *
   * Itu yang membuatnya bekerja di layar artikel baru — sebelumnya tandanya
   * hanya bisa dipasang lewat panel di halaman sunting, yang tidak ada di sana.
   * Di sisi klien tandanya terikat pada isi sumber saat tombolnya ditekan dan
   * lepas sendiri bila sumbernya berubah; di sini yang dibaca tinggal hasilnya.
   *
   * Ditulis 'pending' saat tandanya kosong HANYA untuk draf. Untuk artikel yang
   * sudah terbit, menurunkannya akan ditolak CHECK constraint
   * (published wajib reviewed) dan memperbaiki satu huruf salah jadi mustahil —
   * perilaku yang memang sudah didokumentasikan sejak awal.
   */
  const ditinjau = String(formData.get("translationReviewed") ?? "") === "1";

  const validCategoryIds = await loadCategories(guard);
  const parsed = validatePostForm(readForm(formData, docs), { validCategoryIds });
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
    /*
     * Cover diunggah SEBELUM barisnya dibuat, dan urutan itu wajib.
     *
     * `posts_publish_requires_reviewed_bilingual` menuntut `cover_path` terisi
     * saat status 'published'. Versi sebelumnya menyisipkan baris dulu lalu
     * menempelkan covernya — jadi menerbitkan artikel baru dengan cover yang
     * dipilih di formulir SELALU ditolak constraint, sementara cermin "Syarat
     * terbit" di layar menyatakan semuanya sudah terpenuhi. Cermin dan database
     * berbeda pendapat, dan yang menang database.
     *
     * Bisa dilakukan lebih dulu karena nama berkasnya cuma butuh slug, dan slug
     * sudah ada di formulir — tidak perlu menunggu id.
     */
    let coverPath: string | null = null;
    // Alasannya disimpan, bukan cuma faktanya. Versi sebelumnya hanya menyalakan
    // sebuah boolean dan membuang `unggah.message`, sehingga layar berkata
    // "Cover gagal diunggah" tanpa pernah menyebut sebabnya — padahal sebabnya
    // sudah dihitung persis satu baris di atas, lengkap dengan angkanya.
    let coverGagalPesan: string | null = null;
    if (coverBaru) {
      const unggah = await unggahCover(guard, value.slug, coverBaru);
      if (unggah.ok) coverPath = unggah.path;
      else coverGagalPesan = unggah.message;
    }

    /*
     * Gagal mengunggah cover + niat menerbitkan = berhenti di sini, sebelum
     * insert. Kalau diteruskan, CHECK constraint yang menolak, dan pesannya
     * jadi "Belum semua syarat terbit terpenuhi" — menyuruh orang memeriksa
     * daftar yang justru menyatakan semuanya sudah beres. Aman berhenti karena
     * belum ada baris yang lahir: isian formulirnya utuh dan tinggal diulang.
     */
    if (coverGagalPesan && status === "published") {
      return {
        ok: false,
        message: `Artikel belum bisa terbit karena covernya gagal diunggah. ${coverGagalPesan}`,
        fields: { cover: coverGagalPesan },
      };
    }

    const { data, error } = await guard.supabase
      .from("posts")
      .insert({
        ...value,
        doc_id: toJson(docs.id),
        doc_en: toJson(docs.en),
        translation_status: ditinjau ? "reviewed" : "pending",
        ...(coverPath ? { cover_path: coverPath } : {}),
        status,
        published_at: publishedAt,
      })
      .select("id")
      .single();

    if (error) {
      // Barisnya gagal lahir, jadi covernya tidak dirujuk siapa pun. Dibuang
      // daripada meninggalkan berkas yang tidak akan pernah ditemukan lagi.
      if (coverPath) await guard.supabase.storage.from(IMAGE_BUCKET).remove([coverPath]);
      return { ok: false, message: describeDbError(error, "simpan-artikel-baru") };
    }

    // Kegagalan cover tidak membatalkan artikel yang sudah tersimpan —
    // mengembalikan galat di sini akan meninggalkan formulir tanpa `postId`,
    // dan simpan berikutnya membuat baris kedua. Jadi tetap dialihkan, dengan
    // penanda supaya layar sunting bisa mengatakan apa yang gagal.
    //
    // Alasannya ikut dibawa di query, bukan sekadar penanda `cover=gagal`:
    // sesudah `redirect()` proses ini berakhir, jadi tidak ada tempat lain
    // untuk menitipkan kalimatnya. Dipotong 300 karakter supaya URL tetap
    // wajar; seluruh pesan yang dihasilkan `pesanCover()` jauh di bawah itu.
    revalidatePublic();
    const tandaCover = coverGagalPesan
      ? `&cover=gagal&alasan=${encodeURIComponent(coverGagalPesan.slice(0, 300))}`
      : "";
    redirect(`/admin/artikel/${data.id}?tersimpan=1${tandaCover}`);
  }

  // ------------------------------------------------------------- artikel ada
  const { data: existing, error: loadError } = await guard.supabase
    .from("posts")
    .select("id, slug, status, published_at, cover_path, doc_id, doc_en")
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

  /*
   * Cover diunggah SEBELUM update, alasan yang sama dengan jalur artikel baru:
   * `posts_publish_requires_reviewed_bilingual` menuntut `cover_path` terisi
   * saat status 'published'. Artikel yang belum punya cover lalu diterbitkan
   * bersamaan dengan gambar barunya akan ditolak constraint kalau covernya baru
   * ditempel sesudah update.
   */
  let coverBaruPath: string | null = null;
  if (coverBaru) {
    const unggah = await unggahCover(guard, value.slug, coverBaru);
    if (!unggah.ok) {
      // Belum ada yang tersimpan, jadi berhenti di sini aman — dan jauh lebih
      // jelas daripada menyimpan separuh lalu melaporkan dua hal sekaligus.
      return { ok: false, message: `Cover gagal diunggah: ${unggah.message}` };
    }
    coverBaruPath = unggah.path;
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
      doc_id: toJson(docs.id),
      doc_en: toJson(docs.en),
      ...(ditinjau
        ? { translation_status: "reviewed" }
        : status === "draft"
          ? { translation_status: "pending" }
          : {}),
      cover_alt_id: value.cover_alt_id,
      cover_alt_en: value.cover_alt_en,
      ...(coverBaruPath ? { cover_path: coverBaruPath } : {}),
      status,
      published_at: publishedAt,
    })
    .eq("id", postId);

  if (error) {
    // Update gagal, jadi covernya tidak dirujuk siapa pun.
    if (coverBaruPath) await guard.supabase.storage.from(IMAGE_BUCKET).remove([coverBaruPath]);
    return { ok: false, message: describeDbError(error, "simpan-artikel") };
  }

  // Baru setelah barisnya menunjuk cover baru, yang lama boleh dibuang —
  // urutan sebaliknya menyisakan artikel tanpa gambar bila update gagal.
  if (coverBaruPath) {
    const lama = existing.cover_path;
    if (lama && isOwnedStoragePath(lama) && lama !== coverBaruPath) {
      await guard.supabase.storage.from(IMAGE_BUCKET).remove([lama]);
    }
  }

  // Dijalankan setelah dokumen barunya tersimpan, bukan sebelum: kalau
  // penyimpanan gagal di tengah jalan, gambar yang masih dipakai sudah
  // terlanjur hilang.
  await bersihkanGambarYatim(
    guard,
    [sanitizeDoc(existing.doc_id), sanitizeDoc(existing.doc_en)],
    [docs.id, docs.en],
  );

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

/*
 * `markTranslationReviewed` sebagai Server Action tersendiri DIHAPUS
 * (2026-07-29). Tandanya kini ikut formulir lewat `translationReviewed`,
 * supaya juga bisa dipasang di layar artikel baru — panel yang dulu memuatnya
 * tidak pernah dirender di sana.
 *
 * Dihapus, bukan dibiarkan menganggur: Server Action yang ter-ekspor tetap
 * endpoint POST yang bisa dijangkau dari luar, apa pun yang dirender halaman.
 * Sama alasannya dengan `uploadCover` dan `generateTranslationDraft`.
 */

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
    .select("slug, deleted_at, cover_path, doc_id, doc_en")
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
  // Gambar di dalam isi ikut dibuang. Tanpa ini, menghapus artikel permanen
  // menyisakan berkasnya di bucket selamanya — tidak terlihat dari mana pun,
  // dan tidak ada lagi dokumen yang bisa dipakai menemukannya kembali.
  const gambarIsi = [
    ...collectImagePaths(sanitizeDoc(post.doc_id)),
    ...collectImagePaths(sanitizeDoc(post.doc_en)),
  ].filter((path) => path.startsWith("isi/"));
  if (gambarIsi.length > 0) {
    await guard.supabase.storage.from(IMAGE_BUCKET).remove([...new Set(gambarIsi)]);
  }

  if (post.cover_path && isOwnedStoragePath(post.cover_path)) {
    await guard.supabase.storage.from(IMAGE_BUCKET).remove([post.cover_path]);
  }

  revalidatePublic();
  redirect("/admin?tab=archived");
}

/**
 * Membuat draft terjemahan lewat LLM (langkah 4, K2).
 *
 * Hanya untuk artikel yang masih draf. Menimpa terjemahan artikel yang sudah
 * terbit berarti menyetel `translation_status` kembali ke 'generated', dan
 * constraint terbit menolak itu — pernyataannya akan gagal di tengah jalan.
 * Menariknya dari publik lebih dulu adalah urutan yang benar, bukan halangan.
 */
/**
 * Dependensi terjemahan — glosarium, plafon bulanan, pencatatan pemakaian.
 *
 * Diangkat jadi satu tempat karena dipakai dua pemanggil. Sebelumnya ketiganya
 * disalin di masing-masing, dan salinan seperti itu menyimpang diam-diam:
 * plafon bulanan yang diperbaiki di satu sisi tapi tidak di sisi lain adalah
 * penjagaan biaya yang bocor tanpa satu pun galat.
 *
 * `postId` boleh `null` — artikel yang belum tersimpan belum punya baris untuk
 * dirujuk, tapi karakter yang dipakainya **tetap wajib tercatat**. Kalau tidak,
 * plafon bulanan bisa dilewati begitu saja dengan menerjemahkan berulang kali
 * dari layar artikel baru.
 */
function translationDeps(
  guard: Extract<GuardResult, { ok: true }>,
  postId: string | null,
): TranslateDeps {
  return {
    async loadGlossary() {
      const { data } = await guard.supabase
        .from("translation_glossary")
        .select("term, note")
        .order("term");
      return data ?? [];
    },
    async charactersUsedThisMonth() {
      const { data } = await guard.supabase.rpc("translation_characters_this_month");
      return typeof data === "number" ? data : 0;
    },
    async recordRun(row) {
      await guard.supabase.from("translation_runs").insert({
        post_id: postId,
        direction: row.direction,
        provider: row.provider,
        model: row.model,
        status: row.status,
        billed_characters: row.billedCharacters,
        error_note: row.errorNote,
      });
    },
  };
}

export type FormTranslation =
  | { ok: true; title: string; excerpt: string; coverAlt: string; doc: Doc }
  | { ok: false; message: string };

/**
 * Menerjemahkan isi yang sedang ada di formulir, tanpa menyentuh tabel `posts`.
 *
 * Inilah yang membuat tombol Preview bisa mengisi sisi bahasa satunya di layar
 * **artikel baru**. Jalur lama menuntut `postId` dan memuat isi dari database,
 * jadi di layar itu ia tidak pernah bisa dipanggil — artikelnya belum ada.
 *
 * Yang dikembalikan hanya nilai; yang memindahkannya ke database tetap
 * `saveArticle`. Pemisahan itu disengaja: menerjemahkan bukan menyimpan, dan
 * menekan Preview tidak boleh diam-diam menulis apa pun.
 *
 * Seluruh penjagaan diwarisi dari `translateArticle()` apa adanya — plafon
 * karakter bulanan, glosarium, batas panjang sumber, dan pemecahan batch
 * 50-teks. Tidak ada satu pun yang ditulis ulang di sini.
 */
export async function translateFormContent(formData: FormData): Promise<FormTranslation> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: TIDAK_BERWENANG };

  // Pembatas biaya sebelum pembatas apa pun yang lain. Tombol Preview jauh
  // lebih mudah ditekan berulang daripada tombol di panel samping, jadi batas
  // ini justru lebih penting sejak pemicunya berpindah ke sana.
  const withinLimit = await consumeRateLimit(
    `terjemah:${guard.userId}`,
    RATE_LIMITS.translate.limit,
    RATE_LIMITS.translate.windowSeconds,
  );
  if (!withinLimit) {
    return { ok: false, message: "Terlalu banyak permintaan terjemahan. Coba lagi dalam satu jam." };
  }

  const postId = String(formData.get("postId") ?? "").trim() || null;
  const sourceLocale: Locale = String(formData.get("sourceLocale") ?? "id") === "en" ? "en" : "id";
  const targetLocale: Locale = sourceLocale === "id" ? "en" : "id";

  const get = (name: string) => String(formData.get(name) ?? "");
  const docs = readDocs(formData);
  const sisi = sourceLocale === "id" ? "Id" : "En";

  const outcome = await translateArticle(
    {
      postId: postId ?? "",
      sourceLocale,
      targetLocale,
      title: get(`title${sisi}`),
      excerpt: get(`excerpt${sisi}`),
      coverAlt: get(`coverAlt${sisi}`),
      doc: sourceLocale === "id" ? docs.id : docs.en,
    },
    translationDeps(guard, postId),
  );

  if (!outcome.ok) return { ok: false, message: outcome.message };

  return {
    ok: true,
    title: outcome.draft.title,
    excerpt: outcome.draft.excerpt,
    coverAlt: outcome.draft.coverAlt,
    doc: outcome.draft.doc,
  };
}

/** Byte → "8,4 MB". Koma desimal, karena seluruh dasbor berbahasa Indonesia. */
function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

/**
 * Alasan penolakan → kalimat yang bisa ditindaklanjuti.
 *
 * Fungsi, bukan tabel teks tetap seperti sebelumnya, supaya angka nyata dari
 * berkasnya ikut masuk. Tiga aturan yang dipegang tiap kalimat di bawah:
 * sebut **apa yang salah**, sebut **angkanya berikut batasnya**, dan sebut
 * **apa yang harus dilakukan**. Versi lama hanya memenuhi yang pertama —
 * "Berkas lebih dari 5 MB" tidak memberi tahu berkasnya seberapa besar, jadi
 * satu-satunya cara mematuhinya adalah menebak lalu mencoba lagi.
 */
function pesanCover(reason: CoverProcessingError, detail: CoverErrorDetail = {}): string {
  switch (reason) {
    case "too-large":
      return detail.bytes
        ? `Berkas ini ${formatMB(detail.bytes)}, melebihi batas ${formatMB(MAX_COVER_BYTES)}. Perkecil atau kompres gambarnya dulu, lalu pilih lagi.`
        : `Berkas melebihi batas ${formatMB(MAX_COVER_BYTES)}. Perkecil atau kompres gambarnya dulu, lalu pilih lagi.`;
    case "too-small":
      return detail.width
        ? `Lebar gambar ini ${detail.width} piksel, sedangkan minimalnya ${COVER_MIN_WIDTH} piksel. Pakai berkas asli yang lebih besar — memperbesar gambar kecil akan terlihat pecah saat jadi cover.`
        : `Lebar gambar minimal ${COVER_MIN_WIDTH} piksel.`;
    case "unsupported-format":
      return detail.format
        ? `Format ${detail.format.toUpperCase()} tidak didukung. Simpan ulang gambarnya sebagai JPEG, PNG, WebP, atau AVIF, lalu pilih lagi.`
        : "Format ini tidak didukung. Pakai JPEG, PNG, WebP, atau AVIF.";
    case "not-an-image":
      // Sengaja menyebut kemungkinan penyebabnya: kasus paling sering adalah
      // berkas yang ekstensinya benar tapi isinya bukan gambar — unduhan yang
      // terpotong, atau PDF/dokumen yang diganti namanya.
      return "Isi berkas ini tidak bisa dibaca sebagai gambar, meski namanya berakhiran gambar. Biasanya ini terjadi kalau unduhannya terpotong atau berkasnya sebenarnya bukan foto. Coba buka gambarnya, simpan ulang sebagai JPEG atau PNG, lalu pilih lagi.";
  }
}

/**
 * Memproses satu berkas cover dan menaruhnya di Storage. Tidak menyentuh tabel.
 *
 * Pemisahan itu yang penting. Versi sebelumnya (`simpanCover`) menempelkan
 * cover ke barisnya **sesudah** insert/update, dan itu asal bug terbit:
 * `posts_publish_requires_reviewed_bilingual` menuntut `cover_path` terisi saat
 * status 'published', jadi barisnya ditolak constraint sebelum covernya sempat
 * terpasang — sementara cermin "Syarat terbit" di layar menyatakan semuanya
 * sudah beres. Kedua jalur simpan kini mengunggah lebih dulu dan menyertakan
 * `cover_path` dalam pernyataan yang sama.
 *
 * Bisa dilakukan lebih dulu karena nama berkasnya hanya butuh slug, dan slug
 * sudah ada di formulir — tidak perlu menunggu id.
 *
 * Pembatas lajunya dipanggil di sini supaya berlaku pada setiap jalur masuk.
 */
async function unggahCover(
  guard: Extract<GuardResult, { ok: true }>,
  slug: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
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

  // Ditolak lebih awal supaya 5 MB tidak perlu dibaca ke memori hanya untuk
  // kemudian dilempar.
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, message: pesanCover("too-large", { bytes: file.size }) };
  }

  let processed;
  try {
    processed = await processCoverImage(await file.arrayBuffer());
  } catch (err) {
    if (err instanceof CoverError) {
      return { ok: false, message: pesanCover(err.reason, err.detail) };
    }
    console.error("[unggah-cover] gagal diproses:", err);
    return {
      ok: false,
      message:
        "Gambar gagal diproses di server. Ini bukan soal berkas Anda — coba lagi sebentar lagi, dan kalau tetap gagal laporkan waktu kejadiannya.",
    };
  }

  const path = buildCoverPath(slug);
  const { error } = await guard.supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, processed.data, { contentType: processed.contentType, upsert: false });

  if (error) {
    console.error("[unggah-cover] storage:", error.message);
    return {
      ok: false,
      message:
        "Gambarnya sendiri sudah benar, tapi gagal dikirim ke penyimpanan. Biasanya ini gangguan koneksi sesaat — coba simpan lagi.",
    };
  }

  return { ok: true, path };
}

export type ImageUploadResult = { ok: true; path: string } | { ok: false; message: string };

/**
 * Mengunggah satu gambar untuk disisipkan di tengah isi artikel.
 *
 * Berbeda dari cover, ini **tidak terikat pada baris artikel mana pun**.
 * Gambar disisipkan saat mengetik, dan pada artikel baru belum ada baris untuk
 * ditempeli — memaksa "simpan dulu" adalah friksi yang sama yang sudah dihapus
 * dari alur cover. Konsekuensinya berkasnya bisa jadi yatim bila penulis
 * mengunggah lalu batal menyimpan; itu dibersihkan dari sisi dokumen saat
 * simpan berikutnya (lihat `bersihkanGambarYatim`).
 *
 * Pipeline gambarnya sama persis dengan cover: hanya raster sungguhan yang
 * lolos, hasilnya re-encode ke WebP, dan EXIF — termasuk titik GPS — ikut
 * terbuang. Catatan lapangan penuh foto ponsel, dan lokasi pengambilan bukan
 * sesuatu yang diterbitkan tanpa sengaja.
 */
export async function uploadArticleImage(formData: FormData): Promise<ImageUploadResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: TIDAK_BERWENANG };

  const withinLimit = await consumeRateLimit(
    `unggah-cover:${guard.userId}`,
    RATE_LIMITS.coverUpload.limit,
    RATE_LIMITS.coverUpload.windowSeconds,
  );
  if (!withinLimit) {
    return { ok: false, message: "Terlalu banyak unggahan. Coba lagi dalam satu jam." };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pilih berkas gambar dulu." };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, message: pesanCover("too-large", { bytes: file.size }) };
  }

  let processed;
  try {
    processed = await processCoverImage(await file.arrayBuffer());
  } catch (err) {
    if (err instanceof CoverError) {
      return { ok: false, message: pesanCover(err.reason, err.detail) };
    }
    console.error("[unggah-gambar-isi] gagal diproses:", err);
    return {
      ok: false,
      message:
        "Gambar gagal diproses di server. Ini bukan soal berkas Anda — coba lagi sebentar lagi, dan kalau tetap gagal laporkan waktu kejadiannya.",
    };
  }

  const path = buildBodyImagePath();
  const { error } = await guard.supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, processed.data, { contentType: processed.contentType, upsert: false });

  if (error) {
    console.error("[unggah-gambar-isi] storage:", error.message);
    return {
      ok: false,
      message:
        "Gambarnya sendiri sudah benar, tapi gagal dikirim ke penyimpanan. Biasanya ini gangguan koneksi sesaat — coba sisipkan lagi.",
    };
  }

  return { ok: true, path };
}

/**
 * Membuang berkas gambar yang tidak lagi dirujuk dokumen mana pun.
 *
 * Dipanggil setelah dokumen baru tersimpan, bukan sebelum: kalau penyimpanan
 * gagal di tengah jalan, gambar yang masih dipakai sudah terlanjur hilang.
 * Hanya path berawalan `isi/` yang disentuh — cover punya siklus hidupnya
 * sendiri, dan menghapusnya dari sini akan mengosongkan gambar utama artikel
 * tanpa ada yang memintanya.
 */
async function bersihkanGambarYatim(
  guard: Extract<GuardResult, { ok: true }>,
  sebelum: Doc[],
  sesudah: Doc[],
): Promise<void> {
  const lama = new Set(sebelum.flatMap(collectImagePaths));
  const baru = new Set(sesudah.flatMap(collectImagePaths));

  const yatim = [...lama].filter((path) => !baru.has(path) && path.startsWith("isi/"));
  if (yatim.length === 0) return;

  const { error } = await guard.supabase.storage.from(IMAGE_BUCKET).remove(yatim);
  // Kegagalan di sini tidak boleh menggagalkan penyimpanan artikel: yang
  // tertinggal cuma berkas tak terpakai, sedangkan tulisannya sudah aman.
  if (error) console.error("[gambar-yatim] gagal dibuang:", error.message);
}

/*
 * `uploadCover` sebagai Server Action tersendiri sudah DIHAPUS (2026-07-29).
 *
 * Cover kini bagian dari formulir artikel, jadi action itu tidak dipanggil
 * siapa pun. Meninggalkannya bukan sekadar kode mati: setiap Server Action yang
 * ter-ekspor adalah endpoint POST yang benar-benar bisa dijangkau dari luar,
 * apa pun yang dirender halaman. Permukaan yang tidak dipakai tetap permukaan.
 */
