"use client";

/**
 * Penanda pengunjung untuk like dan pembatas laju komentar.
 *
 * Sengaja acak dan dibuat di peramban, **bukan** diturunkan dari alamat IP.
 * Dua alasan:
 *
 *   1. Privasi. Situs ini jadi tidak menyimpan apa pun yang berasal dari
 *      identitas jaringan pembaca. Catatan privasi di bawah formulir komentar
 *      bisa mengatakannya apa adanya, dan menghapus penanda ini dari
 *      penyimpanan peramban benar-benar memutus kaitannya.
 *   2. Kenyataan teknis. Komentar dari situs ini sampai ke Postgres lewat
 *      server Vercel, jadi IP yang terlihat database sama untuk semua
 *      pengunjung — memakainya sebagai kunci justru akan membuat satu orang
 *      berkomentar memblokir semua orang.
 *
 * Konsekuensinya penanda ini bisa dibuang dan dibuat ulang, sehingga batas
 * per-pengunjung mudah dilewati. Itu diterima: yang benar-benar menahan
 * penyalahgunaan adalah batas per-artikel dan batas global di dalam
 * `post_comment()`, dan keduanya tidak bisa dipalsukan.
 */

const KUNCI = "salsabilah-pengunjung";

/** Cadangan saat penyimpanan peramban diblokir — cukup untuk satu tab. */
let sementara = "";

export function visitorId(): string {
  try {
    const tersimpan = window.localStorage.getItem(KUNCI);
    if (tersimpan && tersimpan.length >= 8) return tersimpan;

    const baru = window.crypto.randomUUID();
    window.localStorage.setItem(KUNCI, baru);
    return baru;
  } catch {
    if (!sementara) sementara = window.crypto.randomUUID();
    return sementara;
  }
}
