import "server-only";

import {
  MAX_RETRIES,
  MAX_TEXTS_PER_REQUEST,
  REQUEST_TIMEOUT_MS,
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
 * dalam istilah pekerjaannya sendiri (teks dan bahasa), sehingga provider
 * berikutnya benar-benar cukup satu file.
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
      /*
       * Dipecah jadi batch karena DeepL menerima maksimal 50 teks per
       * permintaan. Hasilnya disambung menurut urutan batch, dan urutan itulah
       * satu-satunya yang memetakan terjemahan kembali ke node dokumennya —
       * jadi batch dijalankan **berurutan**, bukan paralel. Menjalankannya
       * paralel akan lebih cepat dan sesekali menukar isi paragraf, kerusakan
       * yang tampak sah sampai ada yang membacanya.
       */
      const potongan: string[][] = [];
      for (let i = 0; i < request.texts.length; i += MAX_TEXTS_PER_REQUEST) {
        potongan.push(request.texts.slice(i, i + MAX_TEXTS_PER_REQUEST));
      }
      // Dokumen kosong tetap harus memanggil provider sekali: pemanggilnya
      // menunggu jumlah keluaran yang sama dengan masukan, dan nol sama dengan
      // nol hanya kalau tidak ada yang dikirim.
      if (potongan.length === 0) {
        return { ok: true, texts: [], billedCharacters: 0, modelUsed: config.modelType ?? "default" };
      }

      const semua: string[] = [];
      let ditagih = 0;
      let model = config.modelType ?? "default";

      for (const batch of potongan) {
        const hasil = await kirimSatuBatch(config, { ...request, texts: batch });
        // Satu batch gagal berarti seluruh dokumen gagal. Menyimpan sebagian
        // akan menghasilkan artikel yang separuh diterjemahkan tanpa satu pun
        // penanda bahwa sisanya belum.
        if (!hasil.ok) return hasil;

        semua.push(...hasil.texts);
        ditagih += hasil.billedCharacters;
        model = hasil.modelUsed;
      }

      return { ok: true, texts: semua, billedCharacters: ditagih, modelUsed: model };
    },
  };
}

/** Satu batch, dengan percobaan ulang sesuai aturan `MAX_RETRIES`. */
async function kirimSatuBatch(
  config: TranslationConfig,
  request: ProviderRequest,
): Promise<ProviderResult> {
  let lastFailure: ProviderFailure = {
    ok: false,
    kind: "sementara",
    note: "Tidak ada percobaan yang terjadi.",
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await callOnce(config, request);
    if (result.ok) return result;

    lastFailure = result;
    // Hanya kegagalan sementara yang layak diulang. Kunci ditolak, kuota habis,
    // atau permintaan ditolak tidak akan membaik dengan dicoba lagi — ia hanya
    // menggandakan karakter yang ditagihkan.
    if (result.kind !== "sementara") return result;
  }

  return lastFailure;
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
         * Wajib, dan ketiadaannya adalah kegagalan diam.
         *
         * Tanpa `show_billed_characters`, DeepL menghilangkan `billed_characters`
         * dari respons — bukan mengembalikan nol, melainkan tidak mengirimkannya
         * sama sekali. Pembacaan `?? 0` di bawah lalu mencatat 0 pada setiap
         * baris `translation_runs`, sehingga `translation_characters_this_month()`
         * selamanya menjumlahkan nol dan plafon bulanan (competency 5) tidak
         * pernah menyala. Terlihat pada panggilan sungguhan pertama 2026-07-28;
         * seluruh pengujian sebelumnya memakai respons tiruan yang memuat
         * kolom itu, jadi cacatnya tidak mungkin muncul di sana.
         */
        show_billed_characters: true,

        /*
         * Menjaga baris kosong antarparagraf, awalan "## ", dan awalan "- " pada
         * daftar tetap di tempatnya. Terverifikasi pada artikel penuh: 26 baris
         * sumber keluar tepat 26 baris, tujuh baris daftar tetap tujuh, dan
         * jumlah <ul>/<li>/<h2> hasil render sisi Inggris identik dengan sisi
         * Indonesia.
         */
        preserve_formatting: true,

        /*
         * TIDAK ADA `tag_handling` di sini, dan itu keputusan yang diukur, bukan
         * kelalaian. Percobaan pertama membungkus istilah glosarium dalam
         * `<x>…</x>` dengan `ignore_tags` — pencegahan yang di atas kertas lebih
         * kuat daripada memeriksa hasil. Panggilan sungguhan membantahnya:
         *
         * - DeepL memperlakukan tag itu sebagai **struktural**, memecah kalimat
         *   di setiap batas tag. Artikel 26 baris keluar jadi 62 baris, dan blok
         *   daftar pecah sehingga tujuh butir terender jadi tiga.
         * - Spasi di sekitar tag dilahap: "menyergap kelulut" jadi
         *   "ambushingkelulut", "Madu kelulut" jadi "Honeykelulut".
         * - Dan perlindungannya **tetap tidak menyeluruh** — "## Pemangsa kelulut"
         *   tetap keluar sebagai "Predators of stingless bees".
         *
         * `non_splitting_tags` memperbaiki spasinya tapi tidak pemecahan barisnya.
         *
         * Teks polos ternyata lebih baik pada ketiganya sekaligus: seluruh
         * sembilan istilah glosarium bertahan apa adanya (`kelulut` 3×,
         * `propolis` 2×, `bee bread` 2×, enam nama takson masing-masing 1×) dan
         * strukturnya utuh. **Pelajarannya: DeepL mempertahankan nama ilmiah dan
         * istilah serapan tanpa diminta, dan memaksanya lewat tag justru merusak
         * kalimat di sekitarnya.** Penegakan K2 karena itu kembali ke
         * `missingTerms()` — memeriksa hasil, sesuai bunyi K2 sejak awal.
         */

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
