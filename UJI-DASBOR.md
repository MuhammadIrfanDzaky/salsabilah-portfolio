# Checklist uji dasbor

Tujuh alur di dasbor sudah terbukti benar di tingkat database dan fungsi, tapi **belum pernah
sekali pun dijalankan lewat antarmuka**. Daftar ini menutup celah itu. Butuh sesi admin, jadi
hanya Salsabilah atau pemegang kredensial yang bisa menjalankannya.

**Kenapa sekarang:** tabel `posts` benar-benar kosong (0 baris). Tidak ada konten asli yang bisa
rusak, dan artikel pertama Salsabilah sebaiknya bukan kelinci percobaan bagi tombol yang belum
pernah ditekan.

**Cara melapor:** untuk setiap langkah, cukup `OK` atau apa yang sebenarnya terjadi. Yang paling
berguna justru langkah yang menyimpang — sebutkan pesan yang muncul di layar apa adanya, dan bila
ada, kode `digest` yang ikut tampil di halaman galat.

Label di bawah dikutip persis dari `src/data/admin-copy.ts`, jadi kalau tulisan di layar berbeda,
itu sendiri sudah temuan.

Jalankan di **produksi** (`https://salsabilah.vercel.app/admin`), bukan lokal — yang perlu
dibuktikan adalah lingkungan yang sungguhan dipakai.

---

## Sesi 1 — Simpan, cover, dan penolakan syarat terbit

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 1.1 | Buka `/admin` tanpa login (mode incognito) | Dialihkan ke `/admin/masuk?lanjut=…` | |
| 1.2 | Masuk dengan kredensial yang benar | Mendarat di daftar artikel, kosong, dengan empty state "belum ada artikel" | |
| 1.3 | **Tulis artikel** → pilih Bahasa sumber **Indonesia** → isi Judul dan Isi → perhatikan kolom **Slug** | Slug terisi sendiri dari judul, huruf kecil bertanda hubung | |
| 1.4 | Tekan **Simpan draf** | Muncul "Tersimpan." Artikel ada di tab **Draf**. **Ini jalur `saveArticle` untuk baris baru — belum pernah dijalankan lewat UI** | |
| 1.5 | Perhatikan panel **Cover** | Sebelum langkah 1.4 tertulis "Simpan artikel dulu sebelum mengunggah cover."; sesudahnya panel unggah muncul | |
| 1.6 | **Pilih gambar** → foto asli dari HP (JPEG, >600px, <5MB) → **Unggah cover** | Tombol jadi "Mengunggah…", lalu cover tampil. **Jalur `File → Server Action → Storage → cover_path` belum pernah diuji utuh** | |
| 1.7 | Coba unggah file `.svg` | Ditolak — SVG memang dilarang karena bisa memuat script | |
| 1.8 | Coba unggah gambar berlebar < 600px | Ditolak dengan alasan ukuran terlalu kecil | |
| 1.9 | Tanpa mengisi sisi Inggris, tekan **Terbitkan sekarang** | **"Belum semua syarat terpenuhi. Periksa daftar di atas tombol terbit."** Constraint `23514` sudah terbukti menolak di database; yang diuji di sini pemetaannya jadi kalimat Indonesia | |
| 1.10 | Periksa daftar **Syarat terbit** | Tujuh baris; yang belum beres bertanda × — judul EN, isi EN, dan terjemahan ditinjau | |

## Sesi 2 — Terjemahan otomatis

Baru mungkin setelah `OPENROUTER_API_KEY` **dan** `OPENROUTER_MODEL` ada di Vercel. Keduanya
wajib: tanpa `OPENROUTER_MODEL` fiturnya tetap tidur karena tidak ada model bawaan di kode.

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 2.1 | Pada draf dari Sesi 1, tekan **Buat draft terjemahan** | Sisi Inggris terisi. Statusnya tetap "Terjemahan belum ditinjau." — **sistem tidak pernah menandainya sendiri** | |
| 2.2 | Baca hasilnya | Terjemahan wajar, dan istilah glosarium **tidak** ikut diterjemahkan | |
| 2.3 | Coba pada artikel yang sudah **terbit** | Ditolak dengan penjelasan urutan benar: tarik dulu dari publik | |
| 2.4 | Tulis draf yang **panjang** (mendekati batas 24.000 karakter), lalu buat draft terjemahan | Berhasil, **atau** pesan bahwa jawaban model terpotong karena batas panjang habis. Yang tidak boleh terjadi: terjemahan tersimpan dalam keadaan terputus di tengah kalimat. Kalau Anda melihat hasil yang berhenti mendadak, **itu temuan penting — laporkan** | |
| 2.5 | Setelah beberapa percobaan, periksa pemakaian di OpenRouter | Biaya tetap 0 pada model gratis | |

## Sesi 3 — Terbit, slug, dan siklus hidup

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 3.1 | Lengkapi kedua bahasa, lalu **Tandai terjemahan sudah ditinjau** | Berubah jadi "Terjemahan sudah ditandai ditinjau." | |
| 3.2 | **Terbitkan sekarang** | Berhasil. Menu **Blog** muncul di situs publik (K7 terbuka sendiri) | |
| 3.3 | Tunggu 1–2 menit, buka `/id/blog` dan `/id/blog/<slug>` | Artikel tampil di keduanya. Ini juga pengukuran performa pertama untuk rute berbasis database (#13 menunggu ini) | |
| 3.4 | Isi kolom tanggal dengan waktu **masa depan**, tekan **Terbitkan sekarang** | Tanggal masa depan **diabaikan**, artikel terbit saat ini juga | |
| 3.5 | Ganti **Slug** lewat formulir, simpan | Berhasil. Setelah ~1 menit, URL lama menjawab `308` ke URL baru. Sempat 200 basi lalu 404 sesaat — itu harga ISR, bukan kegagalan | |
| 3.6 | Ubah teks sumber sebuah **draf** yang sudah ditandai ditinjau | Tandanya dicabut otomatis | |
| 3.7 | Ubah teks sumber artikel yang sudah **terbit** | Tandanya **tidak** dicabut; hanya muncul peringatan untuk diperiksa sendiri | |
| 3.8 | **Tarik dari publik** | Kembali jadi draf. Menu Blog hilang lagi bila tidak ada artikel terbit lain | |
| 3.9 | **Arsipkan** | Pindah ke tab **Arsip**, hilang dari daftar utama | |
| 3.10 | **Pulihkan** | Kembali ke daftar. **Belum pernah diuji — artikel `catatan-uji-301` yang dulu jadi bahannya sudah terhapus** | |
| 3.11 | Arsipkan lagi, lalu **Hapus permanen** | Menuntut slug diketik ulang di "Ketik slug artikel untuk mengonfirmasi". Tombolnya hanya ada untuk baris yang sudah diarsipkan | |
| 3.12 | Coba **Jadwalkan** dengan waktu ~3 menit ke depan | Artikel muncul sendiri saat waktunya tiba, tanpa build ulang dan tanpa cron | |

## Sesi 4 — Komentar dan moderasi

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 4.1 | Sebagai pembaca, kirim komentar di artikel terbit | Langsung tampil di puncak daftar | |
| 4.2 | Buka `/admin/komentar` | Komentar itu ada. Tab **Tayang** / **Dihapus** / **Semua** berfungsi | |
| 4.3 | **Hapus** komentar itu | Hilang dari sisi pembaca seketika; isinya masih ada di tab Dihapus | |
| 4.4 | **Pulihkan** | Tampil lagi bagi pembaca. **Tombol ini belum pernah ditekan** | |

## Sesi 5 — Formulir kontak

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 5.1 | Buka bagian Kontak di situs produksi | Formulir tampil bila `NEXT_PUBLIC_FORMSPREE_ID` ada di Vercel; kalau belum, yang tampil tombol **Kirim email** | |
| 5.2 | Kirim satu pesan lewat formulir | Mendarat di halaman terima kasih Formspree, dan emailnya benar-benar masuk. Endpoint-nya sudah diverifikasi hidup, tapi **jalur peramban → Formspree → inbox belum** | |

---

## Setelah selesai

Yang perlu diperbarui di [`PROJECT-SCOPE.md`](./PROJECT-SCOPE.md):

- Bagian **"Yang belum diverifikasi lewat UI"** — hapus baris yang sudah terbukti.
- **#13 Performance** — jalankan Lighthouse pada `/id/blog/<slug>` yang sungguhan; itu pemicu
  reopen yang sudah tercatat.
- **#10 Accessibility** — audit axe pada dasbor, masih tertunda.
- **#48 Backup & Recovery** — pemicunya "setelah artikel asli pertama masuk". Begitu Sesi 3
  lulus dengan artikel sungguhan, gate ini yang berikutnya menagih.

Kalau ada langkah yang gagal, jangan diperbaiki sendiri di dasbor — laporkan apa adanya. Pesan
galat yang muncul justru datanya.
