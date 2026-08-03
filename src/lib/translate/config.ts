import "server-only";

/**
 * Konfigurasi terjemahan otomatis (langkah 4, provider DeepL).
 *
 * Dibaca malas, bukan divalidasi saat startup seperti `supabase/env.ts`.
 * Alasannya: Supabase wajib ada atau situs tidak berarti apa-apa, sedangkan
 * terjemahan otomatis adalah fitur tambahan — tanpa kuncinya situs tetap jalan
 * penuh dan Salsabilah tetap bisa menulis kedua bahasa manual. Menggagalkan
 * startup karena fitur opsional belum dikonfigurasi adalah kerusakan yang tidak
 * perlu.
 */

/**
 * Batas panjang teks sumber. Dijaga sebelum ada biaya yang keluar.
 *
 * Sejak pindah ke DeepL angka ini berhenti jadi perkiraan: DeepL menagih
 * **karakter sumber**, jadi batas ini persis satuan yang sama dengan yang
 * ditagihkan. Pada LLM sebelumnya ia cuma proksi kasar untuk token.
 */
export const MAX_SOURCE_CHARS = 24_000;

/** Berapa lama menunggu provider sebelum menyerah. */
export const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Berapa potongan teks boleh dikirim dalam satu permintaan DeepL.
 *
 * Batas provider, bukan pilihan kami: `text` menerima maksimal 50 entri. Ini
 * mulai menggigit sejak isi artikel jadi dokumen — satu artikel bisa punya
 * ratusan node teks (tiap sel tabel, tiap butir daftar, tiap potongan
 * bertanda tebal adalah node tersendiri), jadi pengiriman sekali jalan akan
 * ditolak begitu artikelnya sedikit rumit. Adapter memecahnya jadi batch dan
 * menyambung hasilnya kembali sesuai urutan.
 */
export const MAX_TEXTS_PER_REQUEST = 50;

/**
 * Berapa kali percobaan ulang saat provider gagal karena sebab sementara.
 *
 * Sengaja satu, bukan "sampai berhasil": loop percobaan ulang yang tak dibatasi
 * adalah cara paling umum sebuah kegagalan berubah jadi tagihan (competency 5).
 */
export const MAX_RETRIES = 1;

export type TranslationConfig = {
  apiKey: string;
  endpoint: string;
  /** Varian bahasa Inggris sebagai sasaran. DeepL menolak `EN` polos. */
  englishTarget: string;
  /** `model_type` DeepL, atau null berarti biarkan DeepL memilih bawaannya. */
  modelType: string | null;
  monthlyCharCap: number;
};

export type ConfigResult =
  | { ok: true; config: TranslationConfig }
  | { ok: false; reason: "tidak-dikonfigurasi" };

function positiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Alamat endpoint diturunkan dari bentuk kuncinya, bukan dikonfigurasi manual.
 *
 * DeepL memakai dua host berbeda untuk paket Free dan Pro, dan kunci Free
 * selalu berakhiran `:fx`. Menyerahkan pilihan host ke env var berarti
 * mengundang kombinasi yang salah — kunci Free ke host Pro menjawab `403`, dan
 * `403` di sisi kami terbaca sebagai "kunci ditolak", yang mengirim orang
 * memeriksa kuncinya padahal kuncinya benar. Diturunkan begini, kombinasi itu
 * tidak bisa terjadi.
 */
export function endpointForKey(apiKey: string): string {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

export function readTranslationConfig(): ConfigResult {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "tidak-dikonfigurasi" };

  return {
    ok: true,
    config: {
      apiKey,
      endpoint: endpointForKey(apiKey),
      // `EN` polos sudah usang sebagai sasaran di DeepL; ragamnya wajib dipilih.
      // Bawaan `EN-GB` di kode tidak melanggar alasan yang dulu melarang model
      // bawaan (competency 34): yang dilarang adalah versi mesin yang bisa
      // berubah diam-diam lewat rilis provider. Ragam bahasa tidak begitu.
      englishTarget: process.env.DEEPL_ENGLISH_TARGET?.trim() || "EN-GB",
      modelType: process.env.DEEPL_MODEL_TYPE?.trim() || null,
      // Paket Free berhenti sendiri di 1 juta karakter (HTTP 456). Plafon di
      // sini sengaja lebih rendah supaya batasnya datang sebagai kalimat
      // Indonesia, bukan sebagai galat provider di tengah pekerjaan.
      monthlyCharCap: positiveInt(process.env.TRANSLATION_MONTHLY_CHAR_CAP, 900_000),
    },
  };
}
