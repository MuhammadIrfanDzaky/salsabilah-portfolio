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
  brand: "Dashboard",

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
    comments: "Komentar",
    newPost: "Tulis artikel",
    signOut: "Keluar",
  },

  moderation: {
    title: "Komentar",
    lead: "Komentar tayang tanpa ditinjau lebih dulu. Menghapus di sini bersifat lunak — isinya tetap tersimpan dan bisa dipulihkan.",
    empty: "Belum ada komentar.",
    emptyFiltered: "Tidak ada komentar pada tab ini.",
    tabVisible: "Tayang",
    tabDeleted: "Dihapus",
    tabAll: "Semua",
    anonymous: "Tanpa nama",
    onArticle: "pada",
    openArticle: "Buka artikel",
    delete: "Hapus",
    restore: "Pulihkan",
    deletedAt: "Dihapus",
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
    groupAddress: "Alamat artikel",
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
      "Pakai tombol di atas kotak ini untuk menebalkan, memiringkan, membuat subjudul, daftar, kutipan, tautan, dan tabel — seperti di pengolah kata. Tidak ada tanda baca yang perlu dihafal.",

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
    coverFailedAfterSave:
      "Artikel tersimpan, tapi covernya gagal diunggah. Pilih gambarnya lagi di bawah, lalu simpan sekali lagi.",

    translationPending: "Terjemahan belum ditinjau.",
    translationReviewed: "Terjemahan sudah ditandai ditinjau.",
    markReviewed: "Tandai terjemahan sudah ditinjau",
    generateDraft: "Buat draft terjemahan",
    generateDraftBusy: "Menerjemahkan…",
    generateDraftHint:
      "Mesin menerjemahkan dari bahasa sumber ke bahasa satunya. Hasilnya selalu draft: baca ulang dan perbaiki sebelum menandainya sudah ditinjau. Istilah di glosarium diperiksa otomatis — kalau ada yang ikut diterjemahkan, draftnya ditolak.",
    generateDraftBlocked:
      "Tersedia untuk artikel berstatus draf. Tarik artikel dari publik dulu bila ingin membuat ulang terjemahannya.",
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
    previewShow: "Preview",
    previewHide: "Tutup preview",
    previewHint:
      "Tekan Preview untuk melihat hasil tulisan Anda dalam kedua bahasa, persis seperti yang akan tampil di situs. Kolom bahasa satunya juga ikut terbuka di sana, siap ditinjau dan disunting.",
    previewEmpty: "Belum ada isi untuk bahasa ini.",
    coverChosen: "Gambar yang baru dipilih",
  },

  error: {
    title: "Ada yang tidak beres",
    body: "Halaman ini gagal dimuat. Coba muat ulang; kalau terus berulang, catat waktunya.",
    retry: "Coba lagi",
  },

  loading: "Loading...",
} as const;
