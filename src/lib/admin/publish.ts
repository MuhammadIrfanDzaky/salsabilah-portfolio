/**
 * Tanggal terbit untuk "Terbitkan sekarang".
 *
 * Tombol bertuliskan "sekarang" tidak boleh menghasilkan artikel yang baru
 * muncul besok. Kalau kolom tanggalnya kosong atau menunjuk masa depan, ia
 * ditimpa waktu sekarang — itu yang diminta tombolnya. Tanggal di masa lalu
 * dipertahankan, supaya menerbitkan ulang artikel lama tidak memalsukannya
 * jadi artikel baru. Untuk terbit di kemudian hari, tombolnya memang yang
 * satu lagi.
 *
 * Ditaruh di lib, bukan di file "use server", supaya bisa diuji tanpa sesi.
 */
export function publishNowDate(fromForm: string | null, now: number = Date.now()): string {
  if (!fromForm) return new Date(now).toISOString();

  const chosen = new Date(fromForm).getTime();
  if (Number.isNaN(chosen) || chosen > now) return new Date(now).toISOString();

  return fromForm;
}
