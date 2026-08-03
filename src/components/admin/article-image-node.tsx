"use client";

import Image from "@tiptap/extension-image";

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
export const ArticleImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-src") ?? element.getAttribute("src"),
        renderHTML: (attributes) => ({ src: attributes.src as string }),
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
