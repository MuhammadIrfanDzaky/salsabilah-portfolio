/**
 * Teks dasbor admin — bahasa Indonesia saja.
 *
 * Sengaja dipisah dari `src/data/profile.ts`. Objek `ui` di sana adalah kontrak
 * copy untuk situs publik dan setiap nilainya berpasangan `{ en, id }` menurut
 * tipenya. Menaruh teks dasbor di sana berarti memaksa terjemahan Inggris yang
 * tidak berarti apa-apa untuk layar yang hanya akan dibuka satu orang berbahasa
 * Indonesia — atau berbohong pada tipenya. Memisahkannya juga menjaga string
 * dasbor tetap di luar bundel yang dikirim ke pengunjung.
 */

export const adminCopy = {
  brand: "Dasbor Salsabilah",

  login: {
    title: "Masuk",
    lead: "Halaman ini hanya untuk pengelola situs.",
    email: "Email",
    emailPlaceholder: "nama@contoh.com",
    password: "Kata sandi",
    submit: "Masuk",
    submitting: "Memeriksa…",
    // Satu pesan untuk email tidak dikenal maupun kata sandi salah. Membedakan
    // keduanya memberi tahu penebak bahwa sebuah alamat email terdaftar.
    failed: "Email atau kata sandi salah.",
    rateLimited: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    incomplete: "Email dan kata sandi wajib diisi.",
    notAdmin: "Akun ini tidak punya akses ke dasbor.",
    lupa: "Lupa kata sandi? Setel ulang lewat Supabase Dashboard — lihat README.",
  },

  nav: {
    posts: "Artikel",
    newPost: "Tulis artikel",
    signOut: "Keluar",
  },

  status: {
    draft: "Draf",
    scheduled: "Terjadwal",
    published: "Terbit",
    archived: "Arsip",
  },

  list: {
    title: "Artikel",
    empty: "Belum ada artikel. Mulai dari tombol Tulis artikel.",
    emptyFiltered: "Tidak ada artikel pada tab ini.",
    tabAll: "Semua",
    colTitle: "Judul",
    colStatus: "Status",
    colUpdated: "Disunting",
    colPublished: "Terbit",
  },

  editor: {
    titleNew: "Artikel baru",
    titleEdit: "Sunting artikel",
    saved: "Tersimpan.",

    groupIdentity: "Identitas",
    groupId: "Bahasa Indonesia",
    groupEn: "English",
    groupCover: "Cover",
    groupPublish: "Terbit",
    groupTranslation: "Tinjauan terjemahan",

    slug: "Slug (URL)",
    slugHint: "Huruf kecil, angka, tanda hubung. Mengganti slug artikel yang sudah terbit otomatis membuat redirect dari URL lama.",
    category: "Kategori",
    sourceLocale: "Bahasa sumber",
    sourceLocaleHint: "Bahasa yang Anda tulis sendiri. Sisi satunya adalah terjemahan yang harus ditinjau.",

    fieldTitle: "Judul",
    fieldExcerpt: "Ringkasan",
    fieldBody: "Isi",
    fieldCoverAlt: "Teks alternatif cover",

    bodyHint:
      "Baris kosong memisahkan paragraf. Awali baris dengan \"## \" untuk subjudul. Apit dengan tanda bintang untuk *miring*. Selain itu tidak ada format lain.",

    publishedAt: "Tanggal & jam terbit (WIB)",
    publishedAtHint: "Disimpan dalam UTC, ditampilkan dalam WIB. Jam di masa depan berarti terjadwal.",
    publishNowHint:
      "Terbitkan sekarang mengabaikan tanggal di masa depan dan menerbitkan saat ini juga. Untuk terbit di kemudian hari, pakai Jadwalkan.",

    coverCurrent: "Cover saat ini",
    coverNone: "Belum ada cover.",
    coverChoose: "Pilih gambar",
    coverUpload: "Unggah cover",
    coverUploading: "Mengunggah…",
    coverHint:
      "JPEG, PNG, WebP, atau AVIF. Maksimal 5 MB, lebar minimal 600 piksel. Gambar diubah ke WebP dan data EXIF (termasuk lokasi GPS) dibuang otomatis.",
    coverSaveFirst: "Simpan artikel dulu sebelum mengunggah cover.",

    translationPending: "Terjemahan belum ditinjau.",
    translationReviewed: "Terjemahan sudah ditandai ditinjau.",
    markReviewed: "Tandai terjemahan sudah ditinjau",
    generateDraft: "Buat draft terjemahan",
    generateDraftSoon: "Terjemahan otomatis belum aktif — dibangun pada langkah berikutnya.",
    sourceEditedWarning:
      "Anda mengubah teks sumber artikel yang sudah terbit. Periksa apakah terjemahannya masih cocok.",

    checklistTitle: "Syarat terbit",
    checklistDone: "Semua syarat terpenuhi.",

    saveDraft: "Simpan draf",
    schedule: "Jadwalkan",
    publishNow: "Terbitkan sekarang",
    unpublish: "Tarik dari publik",
    archive: "Arsipkan",
    restore: "Pulihkan",
    deleteForever: "Hapus permanen",
    deleteConfirmLabel: "Ketik slug artikel untuk mengonfirmasi",
    deleteWarning:
      "Menghapus permanen tidak bisa dibatalkan. Komentar, like, dan riwayat slug artikel ini ikut terhapus.",
    saving: "Menyimpan…",
    previewTitle: "Pratinjau",
  },

  error: {
    title: "Ada yang tidak beres",
    body: "Halaman ini gagal dimuat. Coba muat ulang; kalau terus berulang, catat waktunya.",
    retry: "Coba lagi",
  },

  loading: "Memuat…",
} as const;
