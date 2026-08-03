import "server-only";

import type { Locale } from "@/lib/i18n";
import { LIMITS, cleanText } from "@/lib/validation";
import { MAX_SOURCE_CHARS, readTranslationConfig } from "./config";
import { missingTerms, type GlossaryTerm } from "./glossary";
import { applyTexts, collectTexts, docToPlainText, type Doc } from "@/lib/doc";
import { createDeeplProvider } from "./provider";

/**
 * Terjemahan otomatis EN⇄ID (langkah 4, K2). Provider: DeepL.
 *
 * Yang dihasilkan di sini selalu **draft**. `translation_status` tidak pernah
 * disentuh menjadi 'reviewed' oleh kode ini — hanya Salsabilah yang boleh
 * melakukannya, dan constraint di database menolak artikel terbit tanpa itu.
 * Jadi seburuk apa pun keluaran mesin, ia tidak bisa tayang sendiri.
 *
 * Tiga hal hilang saat pindah dari LLM ke DeepL, dan ketiganya adalah
 * penyederhanaan yang nyata, bukan penghapusan penjagaan:
 *
 * 1. **Tidak ada prompt**, jadi tidak ada permukaan prompt-injection. Teks
 *    Salsabilah dikirim sebagai data. Penanda ARTIKEL_MULAI/ARTIKEL_SELESAI
 *    tidak dibutuhkan karena tidak ada instruksi yang bisa dibajak.
 * 2. **Tidak ada JSON**, jadi tidak ada penguraian defensif. Empat kolom
 *    dikirim sebagai empat teks dan kembali sebagai empat teks, urutannya
 *    dijamin — dan diperiksa di adapter.
 * 3. **Tidak ada anggaran token**, jadi tidak ada jawaban terpotong di tengah
 *    kalimat yang tetap lolos validasi.
 *
 * Yang **tidak** hilang: keluaran tetap diperlakukan sebagai masukan tak
 * tepercaya. Ia divalidasi terhadap batas panjang yang sama dengan formulir
 * manual, dan diperiksa terhadap glosarium sebelum boleh dipakai.
 */

export type RunStatus =
  | "ok"
  | "gagal-provider"
  | "gagal-validasi"
  | "gagal-glosarium"
  | "terlalu-panjang"
  | "plafon-terlampaui";

export type TranslationDraft = {
  title: string;
  excerpt: string;
  coverAlt: string;
  /** Dokumen hasil terjemahan, struktur identik dengan sumbernya. */
  doc: Doc;
  /** Cermin teks polos dari `doc` — untuk kolom `body_*` dan pencarian. */
  body: string;
};

export type TranslateInput = {
  postId: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  title: string;
  excerpt: string;
  coverAlt: string;
  doc: Doc;
};

export type RunRecord = {
  /** `null` untuk artikel yang belum tersimpan — pemakaiannya tetap wajib tercatat. */
  postId: string | null;
  direction: "id-en" | "en-id";
  provider: string;
  model: string;
  status: RunStatus;
  billedCharacters: number;
  errorNote: string | null;
};

export type TranslateDeps = {
  loadGlossary: () => Promise<GlossaryTerm[]>;
  charactersUsedThisMonth: () => Promise<number>;
  recordRun: (row: RunRecord) => Promise<void>;
};

export type TranslateOutcome =
  | { ok: true; draft: TranslationDraft; model: string; billedCharacters: number }
  | { ok: false; status: RunStatus | "tidak-dikonfigurasi"; message: string };

// ------------------------------------------------------------ bahasa DeepL

/**
 * Kode bahasa sumber. Selalu dikirim eksplisit — paket Free tidak menyertakan
 * pendeteksian bahasa, dan menebaknya tidak perlu karena Salsabilah sendiri
 * yang memilih bahasa sumber di formulir.
 */
export function sourceLangFor(locale: Locale): string {
  return locale === "id" ? "ID" : "EN";
}

/** Kode bahasa sasaran. Ragam Inggrisnya dari konfigurasi; `EN` polos usang. */
export function targetLangFor(locale: Locale, englishTarget: string): string {
  return locale === "id" ? "ID" : englishTarget;
}

// ------------------------------------------------------- validasi keluaran

export type ShapeResult =
  | { ok: true; draft: TranslationDraft }
  | { ok: false; note: string };

/**
 * Validasi keluaran terhadap skema (competency 18).
 *
 * Batas panjangnya sengaja sama persis dengan formulir manual: apa pun yang
 * ditolak saat Salsabilah mengetiknya sendiri juga harus ditolak saat mesin
 * yang menuliskannya.
 *
 * Menerima empat teks berurutan — judul, ringkasan, isi, alt cover — karena
 * itulah bentuk yang dikirim ke DeepL. Urutannya sudah dijamin panjangnya oleh
 * adapter; di sini yang diperiksa isinya.
 */
export function validateShape(values: readonly string[], sourceDoc: Doc): ShapeResult {
  if (values.length < 3) return { ok: false, note: "Jumlah kolom keluaran tidak sesuai." };

  const [title, excerpt, coverAlt] = values.slice(0, 3).map((value) => cleanText(value));

  /*
   * Dokumen disusun ulang dari potongan teks, per indeks.
   *
   * `applyTexts()` menolak bila jumlahnya tidak cocok, dan penolakan itu yang
   * paling penting di seluruh fungsi ini: memasang sebagian akan menghasilkan
   * artikel yang separuh berbahasa Inggris dan separuh Indonesia, dengan
   * struktur yang tetap utuh — kerusakan yang tampak sepenuhnya sah sampai ada
   * yang benar-benar membacanya.
   */
  const doc = applyTexts(sourceDoc, values.slice(3));
  if (!doc) return { ok: false, note: "Jumlah potongan teks tidak cocok dengan dokumennya." };

  const body = docToPlainText(doc);

  if (title!.length === 0) return { ok: false, note: "Judul terjemahan kosong." };
  if (body.length === 0) return { ok: false, note: "Isi terjemahan kosong." };
  if (title!.length > LIMITS.title) return { ok: false, note: "Judul terjemahan melebihi batas." };
  if (excerpt!.length > LIMITS.excerpt) {
    return { ok: false, note: "Ringkasan terjemahan melebihi batas." };
  }
  if (body.length > LIMITS.body) return { ok: false, note: "Isi terjemahan melebihi batas." };
  if (coverAlt!.length > LIMITS.coverAlt) {
    return { ok: false, note: "Alt cover terjemahan melebihi batas." };
  }

  return { ok: true, draft: { title: title!, excerpt: excerpt!, coverAlt: coverAlt!, doc, body } };
}

// -------------------------------------------------------------- orkestrasi

export async function translateArticle(
  input: TranslateInput,
  deps: TranslateDeps,
): Promise<TranslateOutcome> {
  const configured = readTranslationConfig();
  if (!configured.ok) {
    return {
      ok: false,
      status: "tidak-dikonfigurasi",
      message: "Terjemahan otomatis belum dikonfigurasi. Isi DEEPL_API_KEY.",
    };
  }
  const config = configured.config;
  const direction: RunRecord["direction"] = input.sourceLocale === "id" ? "id-en" : "en-id";

  /*
   * Tiga kolom pendek dulu, lalu seluruh potongan teks dokumen.
   *
   * Strukturnya TIDAK ikut dikirim — yang bepergian hanya teksnya, dan
   * dokumennya disusun ulang di sini dari urutan yang sama. Itu sebabnya
   * pelajaran `tag_handling` (lihat `provider.ts`) tidak berlaku lagi: tidak
   * ada markup apa pun yang bisa dirusak provider, karena tidak ada markup
   * yang dikirimkan.
   */
  const kepala = [input.title, input.excerpt, input.coverAlt];
  const kolom = [...kepala, ...collectTexts(input.doc)];
  const sumber = [...kepala, docToPlainText(input.doc)].join("\n");

  // Dijaga sebelum satu karakter pun ditagihkan. Sejak pindah ke DeepL angka
  // ini bukan lagi proksi untuk token — ia satuan yang sama dengan tagihannya.
  if (sumber.length > MAX_SOURCE_CHARS) {
    await deps.recordRun({
      postId: input.postId,
      direction,
      provider: "-",
      model: "-",
      status: "terlalu-panjang",
      billedCharacters: 0,
      errorNote: `Sumber ${sumber.length} karakter, batas ${MAX_SOURCE_CHARS}.`,
    });
    return {
      ok: false,
      status: "terlalu-panjang",
      message: `Artikel terlalu panjang untuk diterjemahkan sekaligus (${sumber.length} karakter, batas ${MAX_SOURCE_CHARS}). Terjemahkan per bagian.`,
    };
  }

  // Plafon kumulatif bulan berjalan (competency 5).
  const terpakai = await deps.charactersUsedThisMonth();
  if (terpakai >= config.monthlyCharCap) {
    await deps.recordRun({
      postId: input.postId,
      direction,
      provider: "-",
      model: "-",
      status: "plafon-terlampaui",
      billedCharacters: 0,
      errorNote: `Terpakai ${terpakai} dari plafon ${config.monthlyCharCap}.`,
    });
    return {
      ok: false,
      status: "plafon-terlampaui",
      message:
        "Plafon karakter terjemahan bulan ini sudah tercapai. Terjemahan otomatis berhenti sampai bulan depan; menulis terjemahan manual tetap bisa.",
    };
  }

  const glossary = await deps.loadGlossary();
  const provider = createDeeplProvider(config);

  // Dikirim apa adanya. Percobaan membungkus istilah glosarium dalam tag XML
  // dibatalkan setelah diukur — lihat catatan panjang di `provider.ts`.
  const hasil = await provider.send({
    texts: kolom,
    sourceLang: sourceLangFor(input.sourceLocale),
    targetLang: targetLangFor(input.targetLocale, config.englishTarget),
  });

  if (!hasil.ok) {
    await deps.recordRun({
      postId: input.postId,
      direction,
      provider: provider.name,
      model: "-",
      status: "gagal-provider",
      billedCharacters: 0,
      errorNote: hasil.note,
    });

    const pesan =
      hasil.kind === "kredensial"
        ? "Kunci API DeepL ditolak. Periksa DEEPL_API_KEY — kunci paket Free berakhiran `:fx`."
        : hasil.kind === "kuota"
          ? "Kuota karakter DeepL bulan ini sudah habis. Menulis terjemahan manual tetap bisa; kuotanya pulih awal bulan depan."
          : `Terjemahan otomatis gagal: ${hasil.note} Anda tetap bisa menulis terjemahan manual.`;

    return { ok: false, status: "gagal-provider", message: pesan };
  }

  const bentuk = validateShape(hasil.texts, input.doc);
  if (!bentuk.ok) {
    await deps.recordRun({
      postId: input.postId,
      direction,
      provider: provider.name,
      model: hasil.modelUsed,
      status: "gagal-validasi",
      billedCharacters: hasil.billedCharacters,
      errorNote: bentuk.note,
    });
    return {
      ok: false,
      status: "gagal-validasi",
      message: `Hasil terjemahan tidak sesuai bentuk yang diharapkan (${bentuk.note}) Coba lagi, atau tulis manual.`,
    };
  }

  /*
   * K2: glosarium diverifikasi terhadap keluaran, bukan dipercaya sudah beres.
   *
   * Dengan `ignore_tags` pelanggaran seharusnya tidak mungkin terjadi lagi, dan
   * pemeriksaan ini justru **karena itu** dipertahankan: kalau ia sampai
   * berbunyi, artinya perlindungan tagnya sendiri yang rusak — pembungkusnya
   * hilang, `ignore_tags` tidak terkirim, atau DeepL mengubah perilakunya.
   * Menghapusnya berarti kehilangan satu-satunya alarm untuk kegagalan diam itu.
   */
  const terjemahan = `${bentuk.draft.title}\n${bentuk.draft.excerpt}\n${bentuk.draft.body}\n${bentuk.draft.coverAlt}`;
  const hilang = missingTerms(glossary, sumber, terjemahan);

  if (hilang.length > 0) {
    await deps.recordRun({
      postId: input.postId,
      direction,
      provider: provider.name,
      model: hasil.modelUsed,
      status: "gagal-glosarium",
      billedCharacters: hasil.billedCharacters,
      errorNote: `Istilah hilang: ${hilang.join(", ")}`,
    });
    return {
      ok: false,
      status: "gagal-glosarium",
      message: `Istilah yang seharusnya dibiarkan utuh ikut berubah: ${hilang.join(", ")}. Draft ditolak. Coba lagi, atau tulis manual.`,
    };
  }

  await deps.recordRun({
    postId: input.postId,
    direction,
    provider: provider.name,
    model: hasil.modelUsed,
    status: "ok",
    billedCharacters: hasil.billedCharacters,
    errorNote: null,
  });

  return {
    ok: true,
    draft: bentuk.draft,
    model: hasil.modelUsed,
    billedCharacters: hasil.billedCharacters,
  };
}
