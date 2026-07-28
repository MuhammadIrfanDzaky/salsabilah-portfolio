import "server-only";

import {
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
  TRANSLATION_ENDPOINT,
  type TranslationConfig,
} from "./config";

/**
 * Adapter provider LLM.
 *
 * Seluruh sisa fitur terjemahan bicara ke antarmuka ini, bukan ke OpenRouter.
 * Itu disengaja: pilihan provider hari ini diambil karena alasan biaya dan
 * privasi yang bisa berubah, dan ketika berubah yang perlu ditulis ulang cuma
 * satu file — bukan alur terjemahannya.
 *
 * Antarmuka ini juga yang membuat syarat "fallback saat provider mati"
 * (competency 46) punya tempat yang jelas untuk dipasang nanti.
 */

export type ProviderRequest = {
  system: string;
  user: string;
  maxOutputTokens: number;
};

export type ProviderSuccess = {
  ok: true;
  text: string;
  /** Diambil dari respons, bukan dari konfigurasi — lihat komentar di bawah. */
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type ProviderFailure = {
  ok: false;
  /** `sementara` menandai kegagalan yang layak dicoba ulang sekali. */
  kind: "sementara" | "kredensial" | "permanen";
  note: string;
};

export type ProviderResult = ProviderSuccess | ProviderFailure;

export interface TranslationProvider {
  readonly name: string;
  send(request: ProviderRequest): Promise<ProviderResult>;
}

type ChatCompletion = {
  model?: string;
  provider?: string;
  choices?: Array<{
    message?: { content?: string | null };
    /**
     * `"length"` berarti model berhenti karena kehabisan `max_tokens`, bukan
     * karena selesai. Wajib dibaca — lihat penanganannya di `callOnce()`.
     */
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

export function createOpenRouterProvider(config: TranslationConfig): TranslationProvider {
  return {
    name: "openrouter",

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
        // Hanya kegagalan sementara yang layak diulang. Kunci salah atau
        // permintaan ditolak tidak akan membaik dengan dicoba lagi — ia hanya
        // menggandakan biayanya.
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
    const response = await fetch(TRANSLATION_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      // Tidak boleh ikut cache Next: ini panggilan berbayar yang mengubah
      // keadaan, bukan pembacaan data.
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: request.maxOutputTokens,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        /*
         * `response_format: json_object` sengaja TIDAK dikirim.
         *
         * Dukungannya berbeda-beda antar model di OpenRouter, dan model yang
         * tidak mendukungnya menolak seluruh permintaan. Karena bawaan project
         * ini model gratis — yang justru paling sering tidak mendukung — format
         * keluaran diminta lewat prompt dan diurai secara defensif di
         * `parseTranslationJson()`. Keluaran model tetap diperlakukan sebagai
         * masukan tak tepercaya, jadi tidak ada yang hilang dari penjagaan.
         */
        ...(config.providerOrder.length > 0
          ? {
              // Mengunci provider. Tanpa ini OpenRouter bebas berpindah
              // penyedia — dan "model & versi dipin" (competency 34) jadi
              // klaim kosong.
              provider: { order: config.providerOrder, allow_fallbacks: false },
            }
          : {}),
      }),
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, kind: "kredensial", note: `Kunci API ditolak (${response.status}).` };
    }
    if (response.status === 429) {
      return { ok: false, kind: "sementara", note: "Provider membatasi laju (429)." };
    }
    if (response.status >= 500) {
      return { ok: false, kind: "sementara", note: `Provider bermasalah (${response.status}).` };
    }
    if (!response.ok) {
      return { ok: false, kind: "permanen", note: `Permintaan ditolak (${response.status}).` };
    }

    const data = (await response.json()) as ChatCompletion;

    if (data.error?.message) {
      // OpenRouter bisa mengembalikan 200 dengan galat di dalam body.
      return { ok: false, kind: "permanen", note: "Provider menolak permintaan." };
    }

    const choice = data.choices?.[0];
    const text = choice?.message?.content;

    /*
     * `finish_reason: "length"` berarti model berhenti karena `max_tokens` habis,
     * bukan karena selesai. Ditemukan lewat panggilan sungguhan pertama ke
     * provider (2026-07-28); sebelum itu jalur ini tidak pernah teruji.
     *
     * **Isi yang sempat keluar tidak boleh dipakai.** Itu inti perbaikan ini.
     * Terjemahan yang terpotong di tengah kalimat tetap lolos `validateShape()`,
     * yang hanya memeriksa "tidak kosong" dan "tidak melebihi batas" — jadi
     * tanpa pemeriksaan di sini, artikel yang separuh diterjemahkan bisa
     * tersimpan sebagai draft yang tampak sah, tanpa satu pun penanda bahwa ada
     * bagian yang hilang. Untuk `content: null` pemeriksaan di bawah sudah
     * cukup; yang berbahaya justru saat potongannya berisi teks.
     *
     * Model penalaran membuat ini jauh dari kasus pinggir: `reasoning_tokens`
     * ikut dihitung ke dalam `max_tokens` yang sama, dan pada model bawaan
     * project ini penalaran memakan mayoritas anggaran — terukur 173 dari 201
     * token keluaran hanya untuk menerjemahkan satu kalimat enam kata.
     *
     * **Tetap `sementara`, dan itu keputusan yang diukur, bukan bawaan.**
     * Percobaan pertama menyimpulkan ini deterministik dan hendak menandainya
     * `permanen` (retry hanya menggandakan pemakaian token, competency 5).
     * Pengukurannya membantah: pada satu teks dan satu model yang sama,
     * anggaran 240 token **berhasil** sementara 280 dan 320 gagal terpotong —
     * panjang bagian penalaran berubah tiap panggilan, jadi anggaran yang sama
     * bisa berhasil atau gagal tanpa ada yang diubah. Karena percobaan ulang
     * memang punya peluang nyata untuk lolos, satu retry dibenarkan. Batas
     * `MAX_RETRIES = 1` yang menjaga agar ini tidak jadi loop.
     */
    if (choice?.finish_reason === "length") {
      return {
        ok: false,
        kind: "sementara",
        note:
          "Jawaban model terpotong sebelum selesai karena batas panjangnya habis — " +
          'sering terjadi pada artikel panjang, dan pada model yang "berpikir" dulu ' +
          "sebelum menjawab. Kalau berulang, TRANSLATION_MAX_OUTPUT_TOKENS perlu dinaikkan.",
      };
    }

    if (typeof text !== "string" || text.trim() === "") {
      return { ok: false, kind: "sementara", note: "Provider mengembalikan jawaban kosong." };
    }

    return {
      ok: true,
      text,
      // Dibaca dari respons, bukan disalin dari konfigurasi: kalau routing
      // ternyata melayani model lain dari yang diminta, catatan pemakaian harus
      // menunjukkan yang benar-benar terjadi.
      provider: data.provider ?? "openrouter",
      model: data.model ?? config.model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
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
