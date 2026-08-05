/**
 * Satu-satunya tempat yang tahu bentuk URL publik Supabase Storage.
 *
 * Sebelum file ini, rumus `${host}/storage/v1/object/public/post-covers/${path}`
 * ditulis ulang di empat tempat. Yang membuat itu berbahaya bukan panjangnya,
 * tapi cara gagalnya: bucket ini dipakai cover **dan** gambar isi artikel
 * (awalan `isi/`), jadi kalau bucket atau host berpindah dan satu pemanggil
 * terlewat, gambar rusak hanya di satu permukaan — dan tidak ada error apa pun
 * yang muncul. Halaman terbit tampak benar sementara editor menampilkan kotak
 * kosong, atau sebaliknya.
 *
 * Sengaja TIDAK memakai `server-only`: dipakai juga dari sisi klien
 * (`article-image-node.tsx` ber-"use client", dan `post-doc.tsx` ikut terbawa
 * ke bundel klien lewat `post-form.tsx`).
 */

/**
 * Nama bucket. Cover dan gambar isi berbagi bucket yang sama; yang membedakan
 * hanya awalan path (`<slug>/…` versus `isi/…`), lihat `buildCoverPath()` dan
 * `buildBodyImagePath()` di `covers.ts`.
 */
export const IMAGE_BUCKET = "post-covers";

/**
 * Host Supabase untuk pemanggil yang berjalan (atau bisa berjalan) di peramban.
 *
 * `?? ""` alih-alih memakai `SUPABASE_URL` dari `@/lib/supabase/env`, dan
 * perbedaan itu DISENGAJA — bukan kelalaian yang perlu diseragamkan. `env.ts`
 * melempar saat modulnya dimuat bila variabelnya kosong, yang benar untuk kode
 * server (gagal keras saat start, kompetensi #29) tapi salah untuk kode yang
 * ikut ke peramban: di sana lemparan itu terjadi saat render dan mematikan
 * seluruh editor, padahal akibat sebenarnya cuma gambar yang tidak tampil.
 * Sisi server tetap memakai `env.ts` — lihat `coverUrl()` di `blog.ts`.
 */
export const BROWSER_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Nilai yang sudah bisa dipakai `<img src>` apa adanya.
 *
 * Tiga bentuk, masing-masing dengan asalnya sendiri:
 *   `/…`     berkas statis di `public/` — dipakai baris seed dan konten dummy.
 *   `http…`  URL absolut, mis. cover yang di-host di tempat lain.
 *   `blob:`  pratinjau lokal sebelum unggahnya selesai, hanya muncul di editor.
 */
export function isResolvedImageSrc(value: string): boolean {
  return value.startsWith("/") || value.startsWith("http") || value.startsWith("blob:");
}

/**
 * Kebalikan `isResolvedImageSrc()`: nilai ini objek DI DALAM bucket kita, jadi
 * kitalah yang bertanggung jawab menghapusnya.
 *
 * Dipakai jalur hapus. Salah menjawab di sini tidak memunculkan error apa pun:
 * jawaban `false` yang keliru meninggalkan berkas yatim di bucket selamanya,
 * dan `true` yang keliru berarti mencoba menghapus berkas statis `public/`
 * yang bukan milik Storage. Karena itu ia hidup berdampingan dengan guard yang
 * dipakai membangun URL — kalau daftar bentuknya bertambah, keduanya ikut
 * berubah bersama.
 */
export function isOwnedStoragePath(value: string): boolean {
  return value !== "" && !isResolvedImageSrc(value);
}

/** Path Storage → URL publik. Bucket ini publik, jadi tidak perlu ditandatangani. */
export function storagePublicUrl(baseUrl: string, path: string): string {
  return `${baseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

/**
 * Bentuk yang dipakai sehari-hari: path Storage → URL, nilai yang sudah URL
 * dibiarkan, string kosong dikembalikan apa adanya.
 *
 * `baseUrl` diminta eksplisit, tanpa nilai bawaan, supaya setiap pemanggil
 * memilih sendiri antara host yang gagal keras (server) dan yang gagal diam
 * (peramban) — lihat catatan pada `BROWSER_SUPABASE_URL`.
 */
export function resolveImageSrc(baseUrl: string, src: string): string {
  if (!src) return src;
  if (isResolvedImageSrc(src)) return src;
  return storagePublicUrl(baseUrl, src);
}
