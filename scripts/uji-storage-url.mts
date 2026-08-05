/**
 * Uji penyatuan URL Supabase Storage.
 *
 * Jalankan: `npm run uji:storage-url`
 *
 * Membandingkan helper baru terhadap **salinan verbatim keempat implementasi
 * lama** (di bawah), untuk input yang sama. Yang dijaga di sini bukan "URL-nya
 * benar" — itu terlihat sekali lihat — tapi bahwa penyatuannya tidak diam-diam
 * mengubah jawaban untuk satu bentuk masukan pun. Rumus ini menghasilkan
 * atribut `src`; kalau ia salah, tidak ada error yang muncul, hanya gambar yang
 * tidak tampil di satu permukaan.
 *
 * Satu perbedaan memang DISENGAJA dan diuji secara eksplisit di bawah: guard
 * `coverUrl()` lama tidak mengenal `blob:`. Lihat catatan pada fungsinya di
 * `blog.ts`.
 */
import {
  BROWSER_SUPABASE_URL,
  IMAGE_BUCKET,
  isOwnedStoragePath,
  resolveImageSrc,
  storagePublicUrl,
} from "../src/lib/storage-url";

const HOST = "https://contoh.supabase.co";

// ---------------------------------------------------------- implementasi lama
// Disalin apa adanya dari commit sebelum penyatuan, sebagai pembanding.

/** post-doc.tsx lama */
function lamaImageUrl(src: string): string {
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return src;
  return `${HOST}/storage/v1/object/public/post-covers/${src}`;
}

/** blog.ts lama — perhatikan: TANPA blob: */
function lamaCoverUrl(coverPath: string | null): string | null {
  if (!coverPath) return null;
  if (coverPath.startsWith("/") || coverPath.startsWith("http")) return coverPath;
  return `${HOST}/storage/v1/object/public/post-covers/${coverPath}`;
}

/** covers.ts lama — tanpa guard sama sekali (kode mati, nol pemanggil) */
function lamaCoverPublicUrl(supabaseUrl: string, coverPath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/post-covers/${coverPath}`;
}

/** article-image-node.tsx lama */
function lamaEditorImageUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return src;
  return `${HOST}/storage/v1/object/public/post-covers/${src}`;
}

// ------------------------------------------------------------------- harness

let lolos = 0;
let gagal = 0;

function periksa(nama: string, dapat: unknown, harap: unknown) {
  const benar = dapat === harap;
  if (benar) lolos++;
  else gagal++;
  console.log(`${benar ? "ok   " : "GAGAL"} ${nama.padEnd(46)} ${String(dapat)}`);
  if (!benar) console.log(`      harusnya: ${String(harap)}`);
}

const masukan = [
  "isi/abc-123.webp", // gambar isi artikel
  "slug-artikel/def-456.webp", // cover unggahan
  "/blog-covers/seed.png", // berkas statis public/
  "https://contoh.lain/gambar.jpg", // URL absolut
  "http://contoh.lain/gambar.jpg",
  "blob:http://localhost:3000/uuid", // pratinjau sebelum unggah
];

console.log("— resolveImageSrc setara imageUrl() & editorImageUrl() lama —");
for (const src of masukan) {
  periksa(`imageUrl  ${src}`, resolveImageSrc(HOST, src), lamaImageUrl(src));
  periksa(`editorImg ${src}`, resolveImageSrc(HOST, src), lamaEditorImageUrl(src));
}

console.log("\n— coverUrl: sama untuk semua bentuk yang bisa tersimpan di DB —");
for (const src of masukan.filter((s) => !s.startsWith("blob:"))) {
  periksa(`coverUrl  ${src}`, resolveImageSrc(HOST, src), lamaCoverUrl(src));
}
periksa("coverUrl  null", null, lamaCoverUrl(null));

// Perbedaan yang disengaja, ditulis sebagai pengujian supaya tidak terbaca
// sebagai kelalaian bila kelak ada yang membandingkan keduanya lagi.
console.log("\n— perbedaan yang disengaja: blob: kini ikut dilewatkan —");
periksa("blob: lama di-prefix (salah tapi mustahil)", lamaCoverUrl("blob:x"), `${HOST}/storage/v1/object/public/post-covers/blob:x`);
periksa("blob: baru dibiarkan", resolveImageSrc(HOST, "blob:x"), "blob:x");

console.log("\n— storagePublicUrl setara coverPublicUrl() lama —");
periksa("tanpa guard", storagePublicUrl(HOST, "isi/a.webp"), lamaCoverPublicUrl(HOST, "isi/a.webp"));

console.log("\n— isOwnedStoragePath: jalur hapus —");
periksa("isi/a.webp milik kita", isOwnedStoragePath("isi/a.webp"), true);
periksa("slug/a.webp milik kita", isOwnedStoragePath("slug/a.webp"), true);
periksa("/seed.png bukan milik kita", isOwnedStoragePath("/seed.png"), false);
periksa("https://… bukan milik kita", isOwnedStoragePath("https://x/y.png"), false);
periksa("string kosong bukan milik kita", isOwnedStoragePath(""), false);

console.log("\n— konstanta —");
periksa("nama bucket", IMAGE_BUCKET, "post-covers");
periksa("host peramban tidak melempar saat kosong", typeof BROWSER_SUPABASE_URL, "string");

console.log(`\n${lolos}/${lolos + gagal} lolos`);
process.exit(gagal === 0 ? 0 : 1);
