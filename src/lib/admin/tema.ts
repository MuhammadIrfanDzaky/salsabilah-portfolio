import "server-only";

import { cookies } from "next/headers";

/**
 * Pilihan tema dasbor.
 *
 * Disimpan di cookie dan dibaca di server, BUKAN lewat `next-themes` seperti
 * situs publik. Alasannya bukan CSP — `script-src` dasbor sudah mengizinkan
 * `'unsafe-inline'` — melainkan tiga hal yang semuanya sudah jadi prinsip di
 * bagian lain dasbor ini:
 *
 *   1. Nol JavaScript tambahan. Setiap formulir dasbor sudah dirancang jalan
 *      tanpa JavaScript; penyetel tema yang hanya hidup di klien akan jadi satu-
 *      satunya kontrol yang mati saat skripnya gagal dimuat.
 *   2. Nol kedipan. `next-themes` menghindari kedip dengan menyuntik skrip yang
 *      berjalan sebelum paint. Kalau servernya sendiri yang sudah tahu temanya,
 *      tidak ada yang perlu diperbaiki setelah paint.
 *   3. Tidak ada sumber kebenaran kedua. Rute `/admin` seluruhnya sudah
 *      `force-dynamic`, jadi membaca cookie di layout tidak mengorbankan SSG
 *      apa pun — biaya yang sebenarnya nol di sini, tapi tidak akan nol kalau
 *      pola ini ditiru ke rute publik yang statis.
 *
 * `sistem` sengaja jadi nilai bawaan DAN diwakili oleh ketiadaan cookie:
 * dengan begitu perilaku default persis sama seperti sebelum fitur ini ada,
 * yaitu mengikuti `prefers-color-scheme`.
 */
export const TEMA_COOKIE = "admin-tema";

export type TemaAdmin = "sistem" | "terang" | "gelap";

const NILAI_SAH: readonly TemaAdmin[] = ["sistem", "terang", "gelap"];

export function isTemaAdmin(nilai: string): nilai is TemaAdmin {
  return (NILAI_SAH as readonly string[]).includes(nilai);
}

/**
 * Tema yang berlaku untuk permintaan ini.
 *
 * Cookie yang isinya tidak dikenal diperlakukan sebagai `sistem`, bukan
 * dianggap galat: nilainya datang dari peramban dan bisa diubah siapa saja,
 * dan satu-satunya akibat nilai asing adalah warna yang salah — bukan alasan
 * untuk menggagalkan render halaman.
 */
export async function bacaTemaAdmin(): Promise<TemaAdmin> {
  const nilai = (await cookies()).get(TEMA_COOKIE)?.value;
  return nilai && isTemaAdmin(nilai) ? nilai : "sistem";
}
