import "server-only";

/**
 * Konfigurasi terjemahan otomatis (langkah 4).
 *
 * Dibaca malas, bukan divalidasi saat startup seperti `supabase/env.ts`.
 * Alasannya: Supabase wajib ada atau situs tidak berarti apa-apa, sedangkan
 * terjemahan otomatis adalah fitur tambahan — tanpa kuncinya situs tetap jalan
 * penuh dan Salsabilah tetap bisa menulis kedua bahasa manual. Menggagalkan
 * startup karena fitur opsional belum dikonfigurasi adalah kerusakan yang tidak
 * perlu.
 */

export const TRANSLATION_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Batas panjang teks sumber. Dijaga di sini, sebelum ada biaya yang keluar. */
export const MAX_SOURCE_CHARS = 24_000;

/** Berapa lama menunggu provider sebelum menyerah. */
export const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Berapa kali percobaan ulang saat provider gagal karena sebab sementara.
 *
 * Sengaja satu, bukan "sampai berhasil": loop percobaan ulang yang tak dibatasi
 * adalah cara paling umum sebuah kegagalan berubah jadi tagihan (competency 5).
 */
export const MAX_RETRIES = 1;

export type TranslationConfig = {
  apiKey: string;
  model: string;
  providerOrder: string[];
  maxOutputTokens: number;
  monthlyTokenCap: number;
};

export type ConfigResult =
  | { ok: true; config: TranslationConfig }
  | { ok: false; reason: "tidak-dikonfigurasi" };

function positiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readTranslationConfig(): ConfigResult {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();

  // Model harus disebut eksplisit. Menyediakan model bawaan di kode berarti
  // versi yang dipakai bisa berubah lewat rilis kode, bukan lewat konfigurasi
  // yang sadar — persis yang dilarang competency 34.
  if (!apiKey || !model) return { ok: false, reason: "tidak-dikonfigurasi" };

  return {
    ok: true,
    config: {
      apiKey,
      model,
      providerOrder: (process.env.OPENROUTER_PROVIDER_ORDER ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
      maxOutputTokens: positiveInt(process.env.TRANSLATION_MAX_OUTPUT_TOKENS, 8000),
      monthlyTokenCap: positiveInt(process.env.TRANSLATION_MONTHLY_TOKEN_CAP, 400_000),
    },
  };
}
