# Portofolio & Blog Salsabilah

Situs portofolio akademik Salsabilah, S.P., M.P. — satu halaman profil dalam dua bahasa
(Indonesia & Inggris) plus blog yang ditulis dan diterbitkan sendiri lewat dasbor admin.

- **Live:** https://salsabilah.vercel.app
- **Stack:** Next.js 15 (App Router) · React 19 · Tailwind v4 · TypeScript · Supabase
- **Dokumen utama proyek:** [`PROJECT-SCOPE.md`](./PROJECT-SCOPE.md) — daftar 51 kompetensi
  beserta statusnya. Baca itu dulu sebelum menambah fitur apa pun.

---

## Panduan dasbor untuk Salsabilah

Alamat dasbor: **https://salsabilah.vercel.app/admin**
(saat mengembangkan di komputer sendiri: `http://localhost:3000/admin`)

### Masuk

Isi email dan kata sandi, lalu tekan **Masuk**. Kalau salah, pesannya selalu sama —
"Email atau kata sandi salah" — dan itu memang disengaja supaya orang lain tidak bisa
menebak alamat email mana yang terdaftar.

Setelah 5 percobaan gagal dalam 15 menit, sistem menolak sementara. Tunggu 15 menit.

**Lupa kata sandi?** Belum ada tombol setel ulang di situs. Buka
[Supabase Dashboard](https://supabase.com/dashboard) → project `salsabilah` →
Authentication → Users → pilih akun → *Reset password*.

### Menulis artikel

1. Tekan **Tulis artikel**.
2. Pilih **Bahasa sumber** — bahasa yang benar-benar Anda tulis sendiri.
3. Isi **Judul** dan **Isi** pada kolom bahasa sumber itu.
4. **Slug** terisi otomatis dari judul. Slug adalah bagian akhir alamat artikel
   (`/id/blog/slug-anda`). Boleh diubah selama artikel belum terbit.
5. Tekan **Simpan draf**.

Format tulisan sengaja sederhana, hanya tiga aturan:

| Yang Anda ketik | Hasilnya |
|---|---|
| baris kosong di antara paragraf | paragraf terpisah |
| `## Judul bagian` di awal baris | subjudul |
| `*kata*` | *miring* |

Selain itu tidak ada format lain. Pratinjau di bawah formulir memakai komponen yang sama
persis dengan halaman publik, jadi yang terlihat di sana adalah yang akan terbit.

### Cover

Setelah artikel tersimpan sekali, panel **Cover** muncul. Pilih gambar lalu tekan
**Unggah cover**.

- JPEG, PNG, WebP, atau AVIF. **SVG ditolak** karena bisa menyisipkan program.
- Maksimal 5 MB, lebar minimal 600 piksel.
- Gambar otomatis diubah ke WebP dan diperkecil ke lebar 1600 piksel.
- **Data EXIF dibuang otomatis, termasuk titik koordinat GPS.** Foto dari HP menyimpan
  lokasi pengambilan; tanpa ini, catatan lapangan Anda ikut menerbitkan di mana fotonya
  diambil.

### Dua bahasa

Setiap artikel wajib lengkap dalam **kedua** bahasa sebelum bisa terbit. Alurnya:

1. Tulis di bahasa sumber.
2. Isi sisi terjemahannya.
3. Baca ulang terjemahan itu, lalu tekan **Tandai terjemahan sudah ditinjau**.

Tombol **Buat draft terjemahan** mengisi sisi terjemahan secara otomatis. Yang perlu diketahui:

- Hasilnya **selalu draft**. Sistem tidak pernah menandainya sudah ditinjau — itu hanya bisa
  Anda lakukan, dan artikel tidak bisa terbit tanpanya.
- Istilah di glosarium **dilindungi otomatis**. Sebelum dikirim, setiap istilah dibungkus
  penanda yang membuat penerjemah melewatinya — jadi nama spesies seperti *Heterotrigona
  itama* dan istilah baku seperti `propolis` tidak bisa ikut berubah. Hasilnya tetap
  diperiksa ulang setelahnya; kalau sampai ada yang berubah, draftnya ditolak seluruhnya
  dan Anda diberi tahu istilah mana.
- Glosariumnya **data, bukan kode** — isinya bisa tumbuh. Kalau Anda menulis di bidang baru
  (misalnya artikel pertama tentang lebah kelulut, yang istilahnya tidak ada di daftar awal
  berisi istilah ekonometrika), istilah barunya perlu dimasukkan lebih dulu. Tanpa itu
  pemeriksaannya diam saja — ia hanya menjaga istilah yang terdaftar.
- Hanya tersedia untuk artikel berstatus **draf**. Untuk artikel yang sudah terbit, tarik dulu
  dari publik.
- Kalau mesinnya sedang bermasalah, pesannya menjelaskan apa yang terjadi dan menulis manual
  tetap bisa. Terjemahan otomatis tidak pernah menghalangi Anda bekerja.

Kalau Anda mengubah teks sumber sebuah **draf** yang sudah ditandai ditinjau, tandanya
otomatis dicabut — terjemahannya sudah tidak cocok lagi. Untuk artikel yang **sudah
terbit**, tandanya tidak dicabut (kalau dicabut, memperbaiki satu huruf salah akan
menurunkan artikel dari publik); yang muncul hanya peringatan untuk diperiksa sendiri.

### Menerbitkan

Di bawah formulir ada daftar **Syarat terbit**. Selama masih ada tanda ×, artikel akan
ditolak saat diterbitkan. Tujuh syaratnya: judul ID, judul EN, isi ID, isi EN, cover,
tanggal terbit, dan terjemahan ditinjau.

Tiga tombol:

- **Simpan draf** — belum tampil di situs.
- **Terbitkan sekarang** — langsung tampil. Kalau kolom tanggal berisi waktu di masa
  depan, tombol ini **mengabaikannya** dan memakai waktu sekarang.
- **Jadwalkan** — isi kolom tanggal dengan waktu di masa depan, lalu tekan ini. Artikel
  muncul sendiri saat waktunya tiba. Tidak perlu melakukan apa pun lagi.

Semua jam ditulis dan ditampilkan dalam **WIB**.

Artikel yang baru terbit atau baru terjadwal **butuh sekitar 1–2 menit** sampai muncul di
situs. Itu bukan kegagalan — halaman disimpan sementara agar situs cepat, dan salinannya
disegarkan setiap 60 detik.

Menu **Blog** di situs publik baru muncul setelah ada minimal satu artikel terbit. Kalau
semua artikel ditarik, menunya menghilang lagi.

### Mengganti slug artikel yang sudah terbit

Boleh. Alamat lamanya otomatis dialihkan ke yang baru, jadi tautan yang sudah tersebar
tidak mati. Alihannya juga butuh 1–2 menit untuk aktif.

### Menarik, mengarsipkan, menghapus

- **Tarik dari publik** — artikel kembali jadi draf. Tanggal terbitnya tetap tersimpan,
  jadi menerbitkan ulang tidak mengubahnya jadi artikel baru.
- **Arsipkan** — hilang dari situs dan dari daftar utama, pindah ke tab **Arsip**. Bisa
  **Pulihkan** kapan saja.
- **Hapus permanen** — hanya muncul untuk artikel yang sudah diarsipkan, dan menuntut
  slug artikel diketik ulang. Tidak bisa dibatalkan; komentar, like, dan riwayat alamat
  artikel itu ikut terhapus.

Cara normal menghilangkan artikel adalah menariknya atau mengarsipkannya, bukan
menghapusnya.

### Komentar pembaca

Pembaca bisa berkomentar tanpa akun dan tanpa email. Nama boleh dikosongkan — komentarnya
tampil sebagai "Tanpa nama". **Komentar langsung tayang tanpa Anda tinjau lebih dulu.** Itu
keputusan yang disengaja supaya pembaca tidak terhalang, dan konsekuensinya Anda yang
menyapu bersih setelahnya.

Menu **Komentar** di dasbor menampilkan semuanya, dengan tab Tayang / Dihapus / Semua.

- **Hapus** menyembunyikan komentar dari pembaca seketika. Isinya tetap tersimpan.
- **Pulihkan** mengembalikannya. Tidak ada tombol hapus permanen untuk komentar.

Yang sudah menahan spam tanpa Anda kerjakan apa pun: satu pengunjung dibatasi 5 komentar per
10 menit, satu artikel 30 per jam, dan seluruh situs 100 per jam. Komentar dengan lebih dari
dua tautan ditolak. Semua batas itu berlaku di database, jadi tetap berlaku meski penyerang
melewati situsnya.

Di bawah formulir komentar ada blok berisi aturan berkomentar, catatan privasi, dan tautan
**Laporkan komentar** yang mengarah ke email Anda.

Kalau suatu saat spam datang lebih cepat daripada Anda menghapusnya, itu pemicu untuk berpindah
ke antrean moderasi — komentar ditahan sampai Anda setujui. Catat saja, nanti dibangun.

### Keluar

Tombol **Keluar** di kanan atas. Sesi berakhir sendiri setelah beberapa waktu tidak
dipakai.

---

## Untuk pengembang

### Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka http://localhost:3000 — akan dialihkan ke `/en`.

Skrip: `npm run dev` · `npm run build` · `npm run start` · `npm run lint`.

### Variabel lingkungan

Semuanya dijelaskan di [`.env.example`](./.env.example). Ringkasnya:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | tidak | Domain produksi. Default sudah menunjuk domain saat ini |
| `NEXT_PUBLIC_SUPABASE_URL` | **ya** | Aplikasi gagal start tanpa ini |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **ya** | Boleh terbaca browser; RLS yang menjaga data |
| `NEXT_PUBLIC_FORMSPREE_ID` | tidak | Tanpa ini formulir kontak tidak dirender; yang tampil tombol kirim email |
| `RATE_LIMIT_SALT` | tidak | Menyamarkan alamat IP pada penghitung pembatas laju |
| `DEEPL_API_KEY` | tidak | Tanpa ini fitur terjemahan otomatis nonaktif; sisanya tetap jalan. Kunci Free berakhiran `:fx` |
| `DEEPL_ENGLISH_TARGET` | tidak | Ragam Inggris sasaran: `EN-GB` (bawaan) atau `EN-US`. DeepL menolak `EN` polos |
| `DEEPL_MODEL_TYPE` | tidak | Varian mesin DeepL. Kosong = bawaan DeepL |
| `TRANSLATION_MONTHLY_CHAR_CAP` | tidak | Plafon karakter kumulatif per bulan kalender |

**Service-role key Supabase sengaja tidak pernah dipakai di mana pun.** Aplikasi hanya
memegang kunci publishable, dan seluruh otorisasi dijalankan Row Level Security di
database. Jangan menambahkannya "supaya lebih gampang" — itu membatalkan seluruh model
keamanan proyek ini.

### Struktur

```
src/app/[locale]/      situs publik — beranda, blog, RSS, OG image
src/app/admin/         dasbor (bahasa Indonesia, di luar [locale])
  masuk/               halaman login
  (dasbor)/            semua yang butuh sesi; kurung = tidak menambah segmen URL
src/components/        komponen situs publik + admin/
src/data/profile.ts    SELURUH teks situs publik, berpasangan { en, id }
src/data/admin-copy.ts teks dasbor, Indonesia saja
src/lib/               blog, covers, i18n, slug, time, validation, rate-limit, supabase/
supabase/migrations/   skema berversi, ikut ter-commit
```

Tidak ada teks yang ditulis langsung di JSX. Untuk mengubah kalimat di situs publik,
ubah `src/data/profile.ts`.

### Hal-hal yang mudah salah

**Dasbor punya `<html>`/`<body>` sendiri.** Proyek ini tidak punya `src/app/layout.tsx`;
yang memegangnya adalah `[locale]/layout.tsx`. Halaman apa pun di luar `[locale]` harus
merender kerangkanya sendiri dan mengimpor `globals.css`, kalau tidak utilitas Tailwind
diam-diam tidak menghasilkan apa pun. Lihat `src/app/admin/layout.tsx` dan
`src/app/not-found.tsx`.

**`generateStaticParams` tidak boleh dipakai di `blog/[slug]`.** Kalau ada dan
mengembalikan daftar kosong — keadaan setiap build sebelum artikel pertama terbit — Next
tidak membuat fallback dan setiap permintaan mati dengan `NoFallbackError`. Akibatnya
artikel pertama tidak bisa dibuka sampai ada build ulang, dan redirect 301 ikut mati.
Alasannya ditulis panjang di file itu.

**Setiap Server Action memeriksa otorisasi sendiri.** Layout dasbor tidak dijalankan
sebelum action, jadi `requireAdmin()` di baris pertama setiap action adalah batas
keamanan yang sebenarnya — bukan pengulangan yang bisa dihemat.

**Formulir kontak hanya dirender bila `NEXT_PUBLIC_FORMSPREE_ID` terisi.** Endpoint-nya
dulu di-hardcode `https://formspree.io/f/REPLACE_ME` dan tayang di produksi (setidaknya sejak
deploy 2026-07-26; kemungkinan sejak one-pager pertama naik — tidak ada cara memastikannya).
Endpoint itu menjawab **404**, dan karena formulir HTML biasa hanya berpindah halaman setelah POST,
pengunjung melihat halaman galat Formspree sementara pesannya hilang — tanpa satu pun tanda di
sisi situs ini. Tidak ada cara mengetahui berapa pesan yang hilang. Kalau kelak ada integrasi
pihak ketiga lain, jangan pernah menaruh nilai contoh di jalur yang bisa tayang: baca dari env,
dan bila kosong, jangan render jalurnya.

**Host DeepL tidak boleh dikonfigurasi manual.** `endpointForKey()` menurunkannya dari
akhiran kunci: `:fx` → `api-free.deepl.com`, selain itu → `api.deepl.com`. Kunci Free yang
dikirim ke host Pro menjawab `403`, dan `403` di sisi kami diklasifikasi sebagai "kunci
ditolak" — pesannya menyuruh orang memeriksa kunci yang sebenarnya sudah benar. Jangan
menambahkan env var untuk host "supaya fleksibel"; fleksibilitas itu hanya menambah satu
kombinasi yang salah.

**Urutan `escapeXml` lalu `protectTerms` tidak boleh dibalik.** Kalau dibalik, tag `<x>`
pembungkus glosarium ikut ter-escape jadi `&lt;x&gt;`, DeepL membacanya sebagai teks biasa,
dan seluruh perlindungan glosarium mati **tanpa satu pun galat** — istilah diterjemahkan,
draft ditolak pemeriksaan akhir, dan sebabnya tidak kelihatan di mana pun. Lihat komentar di
`src/lib/translate/index.ts`.

**Slug diganti lewat `rename_post_slug()`, jangan `update posts set slug`.** Yang kedua
melewati pencatatan riwayat dan mematikan redirect 301 tanpa memberi tanda apa pun.

**Cache data Next.js.** `createPublicClient()` menyetel `next: { revalidate: 60 }` pada
setiap fetch. Tanpa itu Next menyimpan respons Supabase tanpa batas waktu dan artikel baru
tidak pernah sampai ke halaman. Jangan menggantinya dengan `cache: "no-store"` — itu
memaksa seluruh rute jadi dinamis dan mematikan generasi statis.

### Basis data

Migrasi ada di `supabase/migrations/`, berurutan dan ikut ter-commit. Setelah menerapkan
migrasi baru, regenerasi tipe:

```bash
npx supabase gen types typescript --project-id htioqsxmbucefsfuiaro > src/lib/supabase/database.types.ts
```

Aturan yang ditegakkan **di database**, bukan di aplikasi:

- Artikel tidak bisa berstatus terbit kecuali kedua bahasa lengkap, cover ada, tanggal
  terbit terisi, dan terjemahan sudah ditinjau (CHECK constraint).
- Draf dan artikel terjadwal tidak terbaca sama sekali oleh kunci publik (RLS).
- Menjadwalkan tidak butuh cron: baris berstatus terbit dengan tanggal di masa depan
  memang belum live sampai waktunya lewat.

### Deploy

Otomatis lewat Vercel setiap push ke `master`.

**Rollback:** Vercel → Deployments → pilih deployment lama → *Promote to Production*.
