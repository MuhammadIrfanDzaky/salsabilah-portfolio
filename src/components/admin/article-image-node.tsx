"use client";

import Image from "@tiptap/extension-image";
import { BROWSER_SUPABASE_URL, resolveImageSrc } from "@/lib/storage-url";

/**
 * Node gambar artikel dengan teks alternatif **dua bahasa**.
 *
 * Ekstensi `Image` bawaan hanya punya satu `alt`, dan itu tidak cukup di situs
 * yang setiap artikelnya wajib lengkap EN+ID: teks alternatif adalah isi yang
 * dibaca pembaca layar, jadi menyisakannya satu bahasa berarti separuh pembaca
 * mendapat keterangan dalam bahasa yang tidak dipilihnya.
 *
 * `altId` adalah sisi yang diketik Salsabilah; `altEn` diisi jalur terjemahan
 * dan tidak pernah menimpa sisi sumber. Keduanya juga ikut terindeks pencarian
 * lewat `docToPlainText()`.
 *
 * `src` menyimpan **path Storage**, bukan URL penuh. Kalau kelak bucket atau
 * domainnya berpindah, tidak ada satu pun dokumen yang perlu ditulis ulang.
 */
/**
 * Path Storage → URL publik, untuk `<img>` DI DALAM editor.
 *
 * Dokumennya tetap menyimpan path (lihat `renderHTML` di bawah: path ditulis ke
 * `data-src`, dan `parseHTML` membaca `data-src` lebih dulu), jadi janji "kalau
 * bucket berpindah tidak ada dokumen yang perlu ditulis ulang" tetap berlaku.
 * Yang ditukar hanya atribut `src` yang dilihat browser.
 *
 * Tanpa ini `src` terkirim apa adanya, dan `isi/<uuid>.webp` adalah URL
 * **relatif**: browser memintanya ke `/admin/artikel/isi/<uuid>.webp`, dapat
 * 404, dan gambar yang baru disisipkan tampil rusak — padahal berkasnya sudah
 * terunggah dengan benar dan artikel terbitnya tampil normal.
 *
 * Aturannya kini dibagi dengan sisi publik lewat `resolveImageSrc()`; dulu
 * disalin, dan salinan itulah yang sempat menyimpang.
 */
function editorImageUrl(src: string): string {
  return resolveImageSrc(BROWSER_SUPABASE_URL, src);
}

export const ArticleImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-src") ?? element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: editorImageUrl(attributes.src as string),
          // Path aslinya, yang dibaca kembali oleh `parseHTML` di atas. Inilah
          // yang membuat dokumen tersimpan tetap berisi path, bukan URL.
          "data-src": attributes.src as string,
        }),
      },
      altId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-alt-id") ?? "",
        renderHTML: (attributes) => ({
          "data-alt-id": attributes.altId as string,
          // `alt` tetap diisi supaya gambar di dalam editor sendiri punya
          // keterangan bagi pembaca layar yang sedang menyunting.
          alt: attributes.altId as string,
        }),
      },
      altEn: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-alt-en") ?? "",
        renderHTML: (attributes) => ({ "data-alt-en": attributes.altEn as string }),
      },
    };
  },
});
