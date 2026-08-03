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

Jalankan di **produksi** (`https://salsabilah.vercel.app/admin`) — yang perlu dibuktikan adalah
lingkungan yang sungguhan dipakai.

**Kecuali Sesi 2.** Terjemahan otomatis butuh `DEEPL_API_KEY`, yang belum ada di Vercel; sesi
itu dijalankan di lokal (`npm run dev`) sampai kuncinya terpasang.

---

## Sesi 1 — Simpan, cover, dan penolakan syarat terbit

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 1.1 | Buka `/admin` tanpa login (mode incognito) | Dialihkan ke `/admin/masuk?lanjut=…` | |
| 1.2 | Masuk dengan kredensial yang benar | Mendarat di daftar artikel, kosong, dengan empty state "belum ada artikel" | |
| 1.3 | **Tulis artikel** → pilih Bahasa sumber **Indonesia** → isi Judul dan Isi → perhatikan kolom **Slug** | Slug terisi sendiri dari judul, huruf kecil bertanda hubung | |
| 1.4 | Perhatikan toolbar di kotak **Isi**, coba tebal/miring/subjudul/daftar | Teks berubah bentuk tanpa satu pun tanda baca yang perlu diketik | |
| 1.5 | Sisipkan **tabel** (▦), lalu tambah baris dan kolom | Tabel muncul dengan baris judul; +baris/+kolom bekerja | |
| 1.6 | Sisipkan **gambar** (🖼) di tengah tulisan | Setelah memilih berkas, muncul pertanyaan keterangan gambar, lalu gambarnya tampil di dalam isi. Jalur unggah baru — belum pernah diuji lewat UI | |
| 1.7 | **Pilih gambar** cover di bagian Identitas — lakukan **sebelum** menyimpan | Pratinjaunya langsung tampil. Cover tidak lagi menunggu artikel tersimpan (berubah 2026-07-29) | |
| 1.8 | Tekan **Simpan draf** | Muncul "Tersimpan." Artikel ada di tab **Draf**, dan covernya ikut terunggah. **Dua jalur sekaligus yang belum pernah diuji lewat UI: `saveArticle` untuk baris baru, dan `File → Server Action → Storage → cover_path`** | |
| 1.9 | Coba unggah file `.svg` | Ditolak — SVG memang dilarang karena bisa memuat script | |
| 1.10 | Coba unggah gambar berlebar < 600px | Ditolak dengan alasan ukuran terlalu kecil | |
| 1.11 | Tanpa mengisi sisi Inggris, tekan **Terbitkan sekarang** | **"Belum semua syarat terbit terpenuhi. Periksa daftar di atas tombol terbit."** Constraint `23514` sudah terbukti menolak di database; yang diuji di sini pemetaannya jadi kalimat Indonesia | |
| 1.12 | Periksa daftar **Syarat terbit** | Tujuh baris; yang belum beres bertanda × — judul EN, isi EN, dan terjemahan ditinjau | |

## Sesi 2 — Terjemahan otomatis

Baru mungkin setelah `DEEPL_API_KEY` ada di Vercel — atau **jalankan sesi ini di lokal**
(`npm run dev`), di mana kuncinya sudah terisi di `.env.local`.

**Alurnya berubah 2026-07-29.** Tombol "Buat draft terjemahan" sudah tidak ada; yang
menerjemahkan sekarang tombol **Preview** di dalam formulir.

| # | Langkah | Yang diharapkan | Hasil |
|---|---|---|---|
| 2.1 | Pada artikel **baru** (belum disimpan sama sekali), isi judul dan isi bahasa Indonesia, lalu tekan **Preview** | Sisi Inggris **terisi sendiri**, kedua bahasa tampil berdampingan. Statusnya tetap "Terjemahan belum ditinjau." — sistem tidak pernah menandainya sendiri | |
| 2.2 | Baca hasilnya | Terjemahan wajar, istilah glosarium tidak ikut diterjemahkan, dan **format ikut terbawa** — tebal, subjudul, daftar, tabel tetap di tempatnya | |
| 2.3 | Tekan **Preview** lagi (tutup, lalu buka) | **Tidak** menerjemahkan ulang. Sisi Inggris yang sudah ada dibiarkan apa adanya | |
| 2.3b | Sunting satu kalimat di sisi Inggris, lalu tekan **Terjemahkan ulang** | Suntingan tertimpa hasil terjemahan baru. Inilah satu-satunya tombol yang boleh menimpa | |
| 2.4 | Tulis artikel **panjang** dengan tabel dan beberapa daftar, lalu Preview | Berhasil dan strukturnya utuh. Isi yang panjang dipecah jadi beberapa permintaan di balik layar (batas 50 potongan teks per permintaan) — kalau urutannya kacau, teksnya akan tertukar antar paragraf. **Kalau Anda melihat kalimat mendarat di tempat yang salah, itu temuan penting — laporkan** | |
| 2.5 | Setelah beberapa percobaan, periksa pemakaian di dasbor DeepL | Masih jauh di bawah 1.000.000 karakter/bulan paket Free | |

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
