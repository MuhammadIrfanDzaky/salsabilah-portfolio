/**
 * Uji pesan penolakan cover.
 *
 * Jalankan: `npm run uji:cover`
 *
 * Yang diperiksa bukan "apakah berkas ditolak" — itu sudah lama benar — tapi
 * **apakah alasannya sampai ke layar berikut angkanya**. Kegagalan yang dijaga
 * di sini tidak menimbulkan error apa pun: berkas tetap ditolak dengan benar,
 * hanya kalimatnya yang berubah jadi tidak bisa ditindaklanjuti, dan itu cuma
 * ketahuan kalau ada yang membacanya.
 *
 * `--conditions=react-server` wajib: `covers.ts` mengimpor `server-only`, yang
 * melempar begitu dimuat di luar konteks server. Paket itu menyediakan varian
 * kosong di bawah kondisi tersebut.
 *
 * Skrip ini sengaja DISIMPAN, bukan dihapus setelah dijalankan. Kompetensi #43
 * di PROJECT-SCOPE.md mencatat bahwa uji-uji sebelumnya hilang begitu selesai,
 * sehingga tidak ada yang menjalankannya ulang saat kode yang dijaganya
 * berubah.
 */
import sharp from "sharp";
import { COVER_MIN_WIDTH, CoverError, MAX_COVER_BYTES, processCoverImage } from "../src/lib/covers";

/** Salinan `formatMB` dari actions.ts — lihat catatan di `pesanCover` di bawah. */
function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

/**
 * Cerminan `pesanCover()` di `artikel/actions.ts`.
 *
 * Disalin, bukan diimpor, karena file itu berlabel `"use server"`: setiap
 * ekspornya harus async dan memuatnya di luar Next akan gagal. Konsekuensinya
 * kalau kalimat di sana diubah, salinan ini harus ikut diubah — yang diuji di
 * sini adalah bahwa `reason` dan `detail` benar-benar terisi, bukan bunyi
 * kalimat finalnya.
 */
function pesanCover(reason: string, detail: { bytes?: number; width?: number; format?: string } = {}) {
  switch (reason) {
    case "too-large":
      return detail.bytes
        ? `Berkas ini ${formatMB(detail.bytes)}, melebihi batas ${formatMB(MAX_COVER_BYTES)}.`
        : "GAGAL: too-large tanpa detail.bytes";
    case "too-small":
      return detail.width
        ? `Lebar gambar ini ${detail.width} piksel, minimalnya ${COVER_MIN_WIDTH} piksel.`
        : "GAGAL: too-small tanpa detail.width";
    case "unsupported-format":
      return detail.format
        ? `Format ${detail.format.toUpperCase()} tidak didukung.`
        : "GAGAL: unsupported-format tanpa detail.format";
    case "not-an-image":
      return "Isi berkas tidak bisa dibaca sebagai gambar.";
    default:
      return `GAGAL: reason tak dikenal (${reason})`;
  }
}

let lolos = 0;
let gagal = 0;

async function periksa(nama: string, buf: Buffer, harusnya: string | null) {
  let hasil: string;
  try {
    await processCoverImage(buf);
    hasil = "DITERIMA";
  } catch (err) {
    hasil = err instanceof CoverError ? pesanCover(err.reason, err.detail) : `lain: ${(err as Error).message}`;
  }

  const benar = harusnya === null ? hasil === "DITERIMA" : hasil.includes(harusnya) && !hasil.startsWith("GAGAL");
  console.log(`${benar ? "ok  " : "GAGAL"} ${nama.padEnd(14)} ${hasil}`);
  if (benar) lolos++;
  else gagal++;
}

const jpeg420 = await sharp({ create: { width: 420, height: 300, channels: 3, background: "#888" } })
  .jpeg()
  .toBuffer();
const gif900 = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#888" } })
  .gif()
  .toBuffer();
const bukanGambar = Buffer.from("ini jelas bukan gambar sama sekali");
const terlaluBesar = Buffer.alloc(MAX_COVER_BYTES + 3_500_000, 7);
const jpegSah = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#4a7" } })
  .jpeg()
  .toBuffer();

// Angka nyata harus muncul di pesannya, bukan sekadar kategori penolakan.
await periksa("420px JPEG", jpeg420, "420 piksel");
await periksa("GIF 900px", gif900, "Format GIF");
await periksa("teks biasa", bukanGambar, "tidak bisa dibaca");
await periksa("8,3MB blob", terlaluBesar, "8,3 MB");
await periksa("1200px JPEG", jpegSah, null);

console.log(`\n${lolos}/${lolos + gagal} lolos`);
process.exit(gagal === 0 ? 0 : 1);
