import "server-only";

import {
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
  GLOSSARY_TAG,
  type TranslationConfig,
} from "./config";

/**
 * Adapter provider terjemahan.
 *
 * Bentuk antarmuka ini **diubah** saat pindah dari OpenRouter ke DeepL, dan itu
 * layak dicatat: versi sebelumnya berbentuk `{system, user, maxOutputTokens}`,
 * yakni antarmuka *chat*, bukan antarmuka *terjemahan*. Klaim lama "pindah
 * provider berarti menulis satu file" karena itu tidak sepenuhnya benar —
 * abstraksinya terlanjur miring ke provider pertama. Bentuk sekarang bicara
 * dalam istilah pekerjaannya sendiri (teks, bahasa, istilah yang dilindungi),
 * sehingga provider berikutnya benar-benar cukup satu file.
 *
 * Perbedaan yang lebih penting daripada bentuknya: **tidak ada prompt.** Teks
 * Salsabilah dikirim sebagai data, bukan sebagai bagian dari instruksi, jadi
 * seluruh permukaan prompt-injection yang dulu dimitigasi dengan penanda
 * ARTIKEL_MULAI/ARTIKEL_SELESAI tidak ada lagi — bukan diperkecil, hilang.
 */

export type ProviderRequest = {
  /** Diterjemahkan berurutan; DeepL mengembalikan urutan yang sama. */
  texts: string[];
  sourceLang: string;
  targetLang: string;
};

export type ProviderSuccess = {
  ok: true;
  /** Sepanjang dan seurutan `texts` pada permintaan. */
  texts: string[];
  /** Dibaca dari respons, bukan dihitung sendiri dari panjang sumber. */
  billedCharacters: number;
  /** `model_type_used` dari respons; varian yang benar-benar melayani. */
  modelUsed: string;
};

export type ProviderFailure = {
  ok: false;
  /** `sementara` menandai kegagalan yang layak dicoba ulang sekali. */
  kind: "sementara" | "kredensial" | "kuota" | "permanen";
  note: string;
};

export type ProviderResult = ProviderSuccess | ProviderFailure;

export interface TranslationProvider {
  readonly name: string;
  send(request: ProviderRequest): Promise<ProviderResult>;
}

type DeeplResponse = {
  translations?: Array<{
    text?: string | null;
    billed_characters?: number;
    model_type_used?: string;
  }>;
  message?: string;
};

export function createDeeplProvider(config: TranslationConfig): TranslationProvider {
  return {
    name: "deepl",

    async send(request) {
      let lastFailure: ProviderFailure = {
        ok: false,
        kind: "sementara",
        note: "Tidak ada percobaan yang terjadi.",
      };

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const result = await callOnce(config, request);
        if (result.ok) return result;

        lastFailure = result;
        // Hanya kegagalan sementara yang layak diulang. Kunci ditolak, kuota
        // habis, atau permintaan ditolak tidak akan membaik dengan dicoba lagi —
        // ia hanya menggandakan karakter yang ditagihkan.
        if (result.kind !== "sementara") return result;
      }

      return lastFailure;
    },
  };
}

async function callOnce(
  config: TranslationConfig,
  request: ProviderRequest,
): Promise<ProviderResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      signal: controller.signal,
      // Tidak boleh ikut cache Next: ini panggilan berkuota yang mengubah
      // keadaan, bukan pembacaan data.
      cache: "no-store",
      headers: {
        Authorization: `DeepL-Auth-Key ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.texts,
        // Selalu dikirim eksplisit. Paket Free tidak menyertakan pendeteksian
        // bahasa, dan menebaknya juga tidak perlu — Salsabilah sendiri yang
        // memilih bahasa sumber di formulir.
        source_lang: request.sourceLang,
        target_lang: request.targetLang,

        /*
         * Perlindungan glosarium (K2), dan alasan kombinasi ini persis begini:
         *
         * - `tag_handling: "xml"` + `ignore_tags` membuat istilah yang dibungkus
         *   <x>…</x> dilewati mesin. Ini **pencegahan**, bukan penolakan
         *   setelah rusak seperti pada LLM sebelumnya.
         * - `outline_detection: false` mematikan tebakan struktur dokumen DeepL.
         *   Teks di sini bukan XML sungguhan — cuma teks biasa yang kebetulan
         *   memuat satu jenis tag milik kami. Membiarkan deteksi struktur menyala
         *   mengundang DeepL menyusun ulang blok yang tidak pernah dimaksudkan
         *   sebagai blok.
         * - `preserve_formatting: true` menjaga baris kosong antarparagraf dan
         *   awalan "## " tetap di tempatnya. Tanpa ini, struktur artikel bisa
         *   berubah dan hasilnya gagal validasi tanpa sebab yang jelas.
         *
         * Glosarium native DeepL sengaja TIDAK dipakai: dokumentasinya menandai
         * pasangan Indonesia tidak didukung, dan `ignore_tags` bekerja untuk
         * pasangan bahasa mana pun.
         */
        tag_handling: "xml",
        // Array, bukan string dipisah koma. Bentuk koma itu milik permintaan
        // form-encoded; body JSON menuntut array, dan mengirim string di sini
        // berisiko ditolak 400 — kegagalan yang akan terbaca seperti masalah
        // teks, padahal soal bentuk permintaan.
        ignore_tags: [GLOSSARY_TAG],
        outline_detection: false,
        preserve_formatting: true,

        ...(config.modelType ? { model_type: config.modelType } : {}),
      }),
    });

    // 456 adalah kode khas DeepL untuk kuota habis, dan wajib dibedakan dari
    // 403. Keduanya "provider menolak", tapi yang satu menyuruh orang memeriksa
    // kunci dan yang satu menyuruh menunggu bulan depan.
    if (response.status === 456) {
      return {
        ok: false,
        kind: "kuota",
        note: "Kuota karakter DeepL untuk bulan ini sudah habis.",
      };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, kind: "kredensial", note: `Kunci API ditolak (${response.status}).` };
    }
    if (response.status === 429) {
      return { ok: false, kind: "sementara", note: "Provider membatasi laju (429)." };
    }
    if (response.status === 413 || response.status === 414) {
      return { ok: false, kind: "permanen", note: "Teks terlalu besar untuk satu permintaan." };
    }
    if (response.status >= 500) {
      return { ok: false, kind: "sementara", note: `Provider bermasalah (${response.status}).` };
    }
    if (!response.ok) {
      return { ok: false, kind: "permanen", note: `Permintaan ditolak (${response.status}).` };
    }

    const data = (await response.json()) as DeeplResponse;
    const translations = data.translations;

    if (!Array.isArray(translations)) {
      return { ok: false, kind: "sementara", note: "Bentuk respons provider tidak dikenali." };
    }

    /*
     * Jumlah hasil wajib sama dengan jumlah kiriman.
     *
     * Pemetaan hasil ke kolom (judul, ringkasan, isi, alt cover) bersandar
     * sepenuhnya pada urutan. Kalau jumlahnya meleset, pemetaan itu bergeser dan
     * ringkasan bisa mendarat di kolom isi tanpa satu pun tanda di layar — jenis
     * kerusakan yang tampak sah sampai ada yang membacanya.
     */
    if (translations.length !== request.texts.length) {
      return {
        ok: false,
        kind: "sementara",
        note: `Provider mengembalikan ${translations.length} hasil untuk ${request.texts.length} teks.`,
      };
    }

    const texts = translations.map((entry) => entry.text);
    if (texts.some((value) => typeof value !== "string")) {
      return { ok: false, kind: "sementara", note: "Ada hasil terjemahan yang bukan teks." };
    }

    return {
      ok: true,
      texts: texts as string[],
      billedCharacters: translations.reduce((total, entry) => total + (entry.billed_characters ?? 0), 0),
      // Dibaca dari respons, bukan disalin dari konfigurasi: kalau DeepL
      // melayani dengan varian lain dari yang diminta, catatan pemakaian harus
      // menunjukkan yang benar-benar terjadi.
      modelUsed: translations[0]?.model_type_used ?? config.modelType ?? "default",
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      kind: "sementara",
      note: aborted
        ? `Provider tidak menjawab dalam ${Math.round(REQUEST_TIMEOUT_MS / 1000)} detik.`
        : "Gagal menghubungi provider.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
