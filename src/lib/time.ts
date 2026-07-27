/**
 * Konversi waktu WIB ⇄ UTC (competency 12).
 *
 * `published_at` disimpan UTC — itu satu-satunya cara jadwal terbit tetap benar
 * ketika dibaca dari server mana pun. Tapi Salsabilah menulis dan membaca
 * jadwal dalam WIB, dan `<input type="datetime-local">` mengirim string polos
 * tanpa zona waktu sama sekali. Tanpa konversi eksplisit di sini, nilai itu
 * akan ditafsirkan menurut zona waktu server — di Vercel berarti UTC, sehingga
 * artikel yang dijadwalkan pukul 09.00 terbit pukul 16.00 WIB.
 *
 * WIB (Asia/Jakarta) tetap UTC+7 sepanjang tahun; Indonesia tidak memakai DST.
 * Karena itu offsetnya boleh jadi konstanta, dan tidak perlu library zona waktu.
 */

export const WIB_OFFSET_MINUTES = 7 * 60;
const WIB_OFFSET_MS = WIB_OFFSET_MINUTES * 60_000;

const DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * "2026-08-01T09:00" (WIB) -> "2026-08-01T02:00:00.000Z".
 * Mengembalikan null bila formatnya salah atau tanggalnya tidak ada.
 */
export function wibToUtcIso(value: string): string | null {
  const match = DATETIME_LOCAL.exec(value.trim());
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = s ? Number(s) : 0;

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const rollover = new Date(asUtc);

  // Date.UTC menggulung tanggal mustahil tanpa mengeluh: 31 Februari diam-diam
  // jadi 3 Maret. Bandingkan balik supaya masukan seperti itu ditolak.
  if (
    rollover.getUTCFullYear() !== year ||
    rollover.getUTCMonth() !== month - 1 ||
    rollover.getUTCDate() !== day
  ) {
    return null;
  }

  return new Date(asUtc - WIB_OFFSET_MS).toISOString();
}

/**
 * "2026-08-01T02:00:00.000Z" -> "2026-08-01T09:00", siap dipakai sebagai
 * `defaultValue` pada `<input type="datetime-local">`.
 */
export function utcIsoToWibInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}` +
    `T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`
  );
}

/** Tampilan untuk dasbor. Selalu berakhiran "WIB" supaya tidak pernah ambigu. */
export function formatWib(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const teks = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);

  return `${teks} WIB`;
}

/** Selisih dari sekarang, dipakai untuk hitung mundur artikel terjadwal. */
export function countdownTo(iso: string | null): string {
  if (!iso) return "";
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";

  const selisihMenit = Math.round((target - Date.now()) / 60_000);
  if (selisihMenit <= 0) return "";

  if (selisihMenit < 60) return `${selisihMenit} menit lagi`;
  if (selisihMenit < 60 * 24) return `${Math.round(selisihMenit / 60)} jam lagi`;
  return `${Math.round(selisihMenit / (60 * 24))} hari lagi`;
}
