# Project Scope & Competency Ledger

- **Category:** `content` `+public-ugc` `+ai`
- **Classified:** 2026-07-09 (re-klasifikasi; sebelumnya `portfolio`, lalu `content`)
- **Last audit:** 2026-08-04
- **Gates open:** **0 dari 21 blocking.** `DEEPL_API_KEY` sudah dipasang pemilik di Vercel
  dan sudah di-redeploy (2026-07-29), jadi #29 tertutup. Dihitung dengan membaca kolom
  Status baris per baris: 21 `applied`.
- **Nol gate terbuka tetap bukan berarti siap rilis.** Blog masih 0 artikel, dan seluruh
  dasbor belum pernah diuji lewat layar — lihat "Yang belum diverifikasi lewat UI".
- **Koreksi hitungan (2026-07-28, audit kedua):** baris ini sebelumnya menulis "0 dari 21",
  padahal kolom Status pada #18, #29, dan #46 masih `deferred`. Angkanya ditulis dari niat
  penutupan langkah 4, bukan dibaca dari tabelnya sendiri. Setelah bukti masing-masing
  diperiksa ulang terhadap repo: #18 dan #46 memang layak `applied` (file yang dikutipnya ada
  dan isinya sesuai), sedangkan #29 **tidak** — teksnya sendiri berbunyi "Sisa: nilai
  produksinya belum ditaruh di Vercel", dan itu definisi gate yang masih terbuka.
  **Ini kali kedua hitungan di header menyimpang dari kolom Status** (yang pertama:
  audit 2026-07-27 menulis 5 padahal 7). Pelajarannya: hitung dengan membaca kolom Status
  baris per baris, jangan dari ingatan tentang apa yang baru dikerjakan.
- **Sejak audit 2026-07-29** (commit `37aa97f`, `9a60db7`, `a4e1102`):
  tata letak editor disusun ulang (cover di depan, slug di belakang, tanggal terbit pindah
  ke balik tombol Jadwalkan); **CSS `.ProseMirror` ditambahkan** — sebelumnya format TipTap
  terpasang di dokumen tapi tidak terlihat sama sekali saat mengetik karena preflight
  Tailwind menormalkan `h2`/`strong`/`ul`; heading dibuka ke H1–H6; kontrol tabel
  dilengkapi; `window.prompt` untuk tautan dan keterangan gambar diganti modal; tombol
  "Tandai terjemahan sudah ditinjau" pindah ke bawah pratinjau dan tandanya kini terikat
  pada isi sumber saat ditekan — menyunting sumber lagi melepasnya sendiri.
- **Bug terbit yang ditemukan pemilik dan sudah ditutup (`a4e1102`):** menerbitkan artikel
  **baru** dengan cover dari formulir **selalu** ditolak. Sejak cover masuk formulir,
  urutannya jadi insert-dulu-baru-tempel-cover, padahal
  `posts_publish_requires_reviewed_bilingual` menuntut `cover_path` terisi saat
  `status='published'` — barisnya ditolak sebelum covernya sempat terpasang, sementara
  cermin "Syarat terbit" di layar menyatakan semuanya beres. Kedua jalur simpan kini
  mengunggah cover **sebelum** insert/update dan menyertakan `cover_path` dalam pernyataan
  yang sama. **Pelajarannya: cermin di layar dan constraint di database adalah dua sumber
  kebenaran, dan yang menang selalu database.**
- **Riwayat:** 14 terbuka sebelum langkah 3 · 7 sesudahnya · 5 setelah Fase 2 · 1 setelah langkah 4
- **Satu gate terbuka bukan satu-satunya penghalang rilis.** Dua tindakan manual dan sejumlah
  alur yang belum pernah diklik masih menunggu — lihat "Yang belum diverifikasi lewat UI" dan
  "Tindakan manual" di bawah.
- **Live:** `https://salsabilah.vercel.app` — blog masih tersembunyi (K7) sampai artikel asli pertama terbit
- **Supabase project:** `htioqsxmbucefsfuiaro` (org `Jek`, region `ap-southeast-1`, $0/bulan)

Situs: portfolio akademik Salsabilah + blog bilingual. One-pager lama tetap statis; blog
menambah database, autentikasi, dashboard admin, terjemahan otomatis berbasis LLM, dan
konten dari publik (komentar & like).

## Keputusan yang mengunci arsitektur (dikonfirmasi 2026-07-09)

| Kode | Keputusan |
|---|---|
| K1 | Salsabilah menerbitkan sendiri lewat dashboard admin. Butuh draft + jadwal terbit |
| K2 | Setiap artikel wajib EN + ID. Dia menulis satu bahasa, sistem membuat draft terjemahan, **dia tinjau dan edit dulu, baru terbit**. Istilah teknis dilindungi glosarium dan tidak diterjemahkan |
| K3 | Like, comment, share per artikel. Komentar: **nama opsional, tanpa email, tanpa antrean moderasi — langsung tampil**. Salsabilah bisa menghapus kapan saja (soft delete) |
| K4 | Stack: **Supabase** (Postgres + Auth + Storage + RLS) |
| K5 | Dibangun **bertahap**. Fase 1: fondasi + tulis/terjemah/terbit + grid + pencarian + cover. Fase 2: like, comment, share. **Urutan diubah 2026-07-28 atas permintaan pemilik: Fase 2 dikerjakan lebih dulu, langkah 4 (terjemahan LLM) menyusul.** Konsekuensinya sampai langkah 4 selesai, sisi terjemahan setiap artikel diisi manual — K2 tetap berlaku dan gate terbitnya tidak dilonggarkan |
| K6 | Kategori awal: 3 — ringkasan awam publikasi, analisis komoditas & kebijakan, catatan lapangan/konferensi |
| K7 | Entri nav & rute blog **disembunyikan** sampai ada minimal 1 artikel berstatus published |
| K8 | Konten awal memakai dummy data; Salsabilah mengganti setelah dashboard siap. **3 artikel dummy sudah masuk**, judulnya diawali `[DUMMY]` dan cover-nya berupa placeholder di `public/blog-covers/` — semuanya harus dihapus sebelum rilis. **Selesai** (commit `d1b5291`): `posts` 0 baris, direktori cover placeholder tidak ada lagi |
| K10 | Isi artikel disimpan sebagai **dokumen terstruktur** (JSON TipTap/ProseMirror) di `doc_id`/`doc_en`, bukan teks bertanda baca. Editornya ber-toolbar seperti pengolah kata, termasuk tabel dan gambar di tengah tulisan. **Pemilih jenis huruf, ukuran, dan warna sengaja tidak ada** — ketiganya menabrak tipografi situs dan membuat tiap artikel tampil berbeda. Diputuskan pemilik 2026-07-29 |
| K11 | Terjemahan dipicu tombol **Preview**, bukan otomatis sambil mengetik (kuota), dan **tidak pernah menimpa** sisi yang sudah ada isinya kecuali lewat tombol "Terjemahkan ulang" yang terpisah |
| K9 | Provider terjemahan **DeepL paket Free**, dikonfirmasi pemilik 2026-07-28. Paket Free menyatakan "Tidak ada pelatihan data: NO" — teks yang dikirim boleh dipakai DeepL untuk melatih layanannya, termasuk **draf yang belum terbit**. Diterima secara sadar |

**Risiko yang diterima secara sadar (K9):** draf artikel Salsabilah mengalir ke pihak ketiga
yang berhak melatih modelnya dengan teks itu. Yang membuat ini bukan penurunan: jalur gratis
sebelumnya sama saja — endpoint gratis OpenRouter praktis terkunci di balik setelan akun
"allow routing to providers that may train on your data", dan `.env.example` proyek ini sendiri
sudah mencatat gejalanya. Yang meringankan: isi artikelnya memang ditujukan untuk terbit
publik, jadi kerahasiaannya berjangka, bukan permanen. **Pemicu buka ulang:** ada tulisan
pra-terbit yang benar-benar sensitif — data penelitian yang belum dipublikasikan, naskah dalam
proses telaah sejawat, atau apa pun yang terikat embargo penerbit. Jalannya naik ke DeepL Pro,
yang menghapus teks segera dan tidak melatih; tidak ada kode yang perlu berubah, hanya kunci
(dan host ikut berpindah sendiri karena diturunkan dari akhiran kunci).

**Risiko yang diterima secara sadar (K3):** tanpa pra-moderasi, spam dan komentar kasar bisa
tampil publik sebelum dilihat Salsabilah. Mitigasi yang disepakati tidak menambah friksi bagi
pembaca: rate limit per IP, honeypot, batas panjang, heuristik tautan, sanitasi server-side,
soft delete + restore. Bila volume spam melewati kemampuan hapus manual, pemicu membuka ulang
keputusan ini adalah beralih ke antrean moderasi.

---

## Blocking (harus `applied` sebelum blog diluncurkan)

| # | Competency | Status | Evidence / reason |
|---|---|---|---|
| 8 | UI/UX & Responsiveness | applied | One-pager terukur di 375/440/768/1440px tanpa scroll horizontal. **Reopen:** rute blog & dashboard harus diuji pada lebar yang sama |
| 2 | Documentation & Maintenance | applied | `README.md` ditulis ulang (2026-07-27): panduan dasbor berbahasa Indonesia untuk Salsabilah — masuk, menulis, cover, dua bahasa, terbit/jadwal, tarik/arsip/hapus — plus bagian pengembang berisi variabel lingkungan, struktur, dan lima jebakan yang sudah pernah menggigit. **Reopen: saat fitur terjemahan (langkah 4) menambah alur baru** |
| 5 | Cost & FinOps | applied | **Disederhanakan 2026-07-28 saat pindah ke DeepL, dan penyederhanaannya adalah intinya.** Tiga lapis sekarang, bukan empat: panjang sumber dibatasi 24.000 karakter; `terjemah:<userId>` membatasi 30 permintaan per jam; dan `TRANSLATION_MONTHLY_CHAR_CAP` membatasi total karakter per bulan kalender, dihitung **di database** lewat `translation_characters_this_month()` supaya tidak ada jendela balapan antara membaca jumlah dan memutuskan boleh-tidaknya memanggil provider. Saat plafon bulanan tercapai, terjemahan otomatis berhenti dan Salsabilah tetap bisa menulis manual — bukan situs yang mati. Setiap percobaan tercatat di `translation_runs`, berhasil maupun gagal, sehingga pemakaian bisa ditinjau. **Lapis per-permintaan dihapus karena tidak ada lagi yang perlu dijaga di sana**, bukan karena dilonggarkan: DeepL menagih karakter sumber, jadi batas 24.000 karakter yang sudah ada sejak awal **adalah** plafon per-permintaannya — satuan yang sama persis dengan tagihannya. **Ini sekaligus menutup cacat akuntansi yang terukur pada provider sebelumnya:** plafon lama dihitung dari `completion_tokens`, dan pada model penalaran mayoritas angka itu token "berpikir" alih-alih teks terjemahan (terukur 173 dari 201 pada 2026-07-28), sehingga plafon bulanan tercapai kira-kira lima kali lebih cepat daripada dugaan berbasis panjang artikel. Karakter tidak punya masalah itu — yang dihitung persis yang diterjemahkan. **Biaya berjalan nol**, dan kali ini bukan karena model gratis yang bisa berubah kebijakan: paket DeepL Free menyediakan 1.000.000 karakter/bulan dan **berhenti** di situ (HTTP 456), tidak menagih. `TRANSLATION_MONTHLY_CHAR_CAP` bawaannya 900.000, sengaja di bawah kuota provider supaya batasnya datang sebagai kalimat Indonesia, bukan sebagai galat provider di tengah pekerjaan. Setara ~37 artikel terpanjang per bulan, dan artikel nyata pertama hanya 3.874 karakter |
| 6 | Legal & Compliance | applied | Blok "Sebelum berkomentar" tepat di bawah formulir, dua bahasa: aturan berkomentar (langsung tayang tanpa ditinjau, relevan, santun, tanpa iklan/serangan pribadi/data pribadi orang lain, Salsabilah berhak menghapus), catatan privasi, dan jalur pelaporan berupa tautan `mailto` ke alamat yang memang sudah tampil publik — sengaja tidak lewat form kontak. (Saat blok ini ditulis, alasannya adalah endpoint Formspree masih `REPLACE_ME`; endpoint itu sudah ditangani 2026-07-28, tapi `mailto` tetap pilihan yang benar untuk jalur pelaporan karena tidak bergantung pihak ketiga mana pun.) **Catatan privasinya bisa apa adanya karena tidak ada yang perlu disamarkan:** penanda pengunjung dibuat acak di peramban dan tidak diturunkan dari alamat IP, jadi situs ini tidak menyimpan apa pun yang berasal dari identitas jaringan pembaca, dan menghapus penanda itu benar-benar memutus kaitannya. **Reopen: proses takedown formal bila ada permintaan hukum; catatan privasi untuk data yang dikumpulkan Formspree, saat `NEXT_PUBLIC_FORMSPREE_ID` diisi — sejak saat itu nama, email, dan isi pesan pengunjung mengalir ke pihak ketiga, dan itu perlu disebut** |
| 11 | SEO & Metadata | applied | Metadata per-locale + OG/Twitter + canonical + `hreflang`, OG image dinamis, `src/app/sitemap.ts` (10 URL dengan 20 alternate hreflang; indeks blog hanya masuk bila ada artikel terbit), `src/app/robots.ts` (menutup `/admin` dan `/api/`, menunjuk sitemap), structured data `BlogPosting` per artikel, dan RSS per bahasa di `/[locale]/feed.xml` — terbukti terparsing sebagai XML valid dengan `Content-Type: application/rss+xml`. Redirect 301 slug lama terverifikasi ujung-ke-ujung 2026-07-27: `rename_post_slug()` mencatat slug lama, dan `/id/blog/asd` menjawab `308 Permanent Redirect → /id/blog/catatan-uji-301`. **Catatan:** rute `blog/[slug]` kini `ƒ` (bukan `●`) — lihat jebakan `NoFallbackError` di bawah |
| 12 | i18n / Timezone / Locale | applied | `src/lib/time.ts` mengonversi WIB⇄UTC dengan offset tetap (+7, Indonesia tanpa DST) — bukan mengandalkan zona waktu server, yang di Vercel berarti UTC dan akan menggeser jadwal 7 jam. Terverifikasi 6/6 lewat pemanggilan langsung: `wibToUtcIso("2026-08-01T09:00")` → `"2026-08-01T02:00:00.000Z"`, pulang-pergi utuh, dan tanggal mustahil (31 Februari) ditolak alih-alih digulung diam-diam. Setiap tampilan waktu di dasbor berakhiran literal "WIB" |
| 13 | Performance | applied | Diukur pada **deploy nyata** `https://salsabilah.vercel.app` (2026-07-26): `/en` Performance 94 · Accessibility 100 · Best Practices 100 · SEO 100; `/id` 96 pada run bersih. LCP stabil 2,5–2,8s, CLS 0. **Catatan:** skor sempat 66–83 pada beberapa run — penyebabnya TBT yang melonjak mengikuti beban CPU mesin pengukur, bukan situs (LCP tidak berubah). **Reopen: setelah halaman blog benar-benar terbit, karena rute berbasis database belum ikut terukur** |
| 16 | Data Modeling | applied | `supabase/migrations/0001_init_blog.sql` diterapkan ke project. Constraint dideklarasikan di database, bukan hanya di aplikasi: gate terbit bilingual+reviewed, FK dengan `on delete restrict/cascade`, unique pada slug, PK gabungan pada `likes` untuk idempotensi, indeks pada semua kolom filter, dan `post_slug_history` untuk redirect 301. Terverifikasi via `list_tables`: 7 tabel, RLS aktif semua |
| 18 | Data Validation | applied | Sisi artikel **sudah**: `src/lib/validation.ts` memvalidasi server-side per tipe, panjang, dan enum; `category_id` dicocokkan ulang dengan daftar dari server, bukan dipercaya dari `<select>`; teks dinormalisasi NFC dan karakter kontrol dibuang. Ditulis tangan, tanpa dependensi baru, agar `npm audit` tetap 0. Komentar divalidasi **di dalam database** oleh `post_comment()` (migrasi 0006), bukan di aplikasi: isi kosong, >2000 karakter, nama >60 karakter, dan lebih dari dua tautan masing-masing ditolak dengan kode tersendiri. Terverifikasi lewat kunci anon langsung — jalur yang melewati aplikasi sepenuhnya. Output model juga divalidasi terhadap skema sebelum dipakai (`validateShape()` di `src/lib/translate/index.ts`): bukan objek, kolom non-teks, judul atau isi kosong, dan panjang melebihi batas masing-masing ditolak dengan alasan tersendiri — batasnya sengaja identik dengan formulir manual, karena apa pun yang ditolak saat Salsabilah mengetiknya harus ditolak saat model yang menuliskannya. Terverifikasi 11/11 |
| 19 | Data Lifecycle | applied | Artikel: **Tarik dari publik** mengembalikan ke draf tanpa menyentuh `published_at` (menerbitkan ulang tidak memalsukan tanggal); **Arsipkan** hanya menyetel `deleted_at`; **Pulihkan** mengembalikannya. Hapus permanen hanya tersedia untuk baris yang sudah diarsipkan dan menuntut slug diketik ulang — jalan keluar untuk K8. Tidak ada jalur hard delete dari artikel live maupun draf. Komentar: menghapus selalu lunak (`deleted_at`), dan `comments_public_read` sudah menyaring `deleted_at is null` sehingga komentar hilang dari pembaca tanpa satu pun penyaringan di aplikasi. Terverifikasi: 8 komentar terlihat → hapus lunak satu → kunci anon melihat 7, barisnya masih ada di database |
| 21 | Search | applied | **Selamat dari perubahan format isi (2026-07-29), dan itu disengaja.** Saat isi artikel jadi dokumen JSON, `body_id`/`body_en` tidak dihapus melainkan diturunkan jadi **cermin teks polos** (`docToPlainText()`), sehingga seluruh mesin pencarian di bawah ini tidak perlu disentuh sama sekali. Mengisi kolom itu dengan JSON akan membuat tsvector mengindeks nama kunci dan tanda kurung — pencarian tetap "jalan" tapi hasilnya omong kosong, dan kegagalan seperti itu tidak menimbulkan galat apa pun. Cermin diturunkan di `readForm()`, bukan dibaca terpisah dari formulir; kalau dibaca terpisah keduanya bisa berbeda dan pencarian akan menemukan kata yang sudah tidak ada di artikelnya. Teks alternatif gambar ikut terindeks. Full-text search Postgres via kolom tsvector `search_id`/`search_en` dengan indeks GIN, mode `websearch` — bukan `LIKE '%x%'`. Form GET biasa sehingga tetap jalan tanpa JavaScript dan hasilnya berupa URL yang bisa dibagikan. Terverifikasi: `q=cengkeh`→1, `q=clove`→1, `q=zzzznonsense`→0, dan irisan filter+cari benar (`kategori=analisis&q=cengkeh`→1, `kategori=catatan&q=cengkeh`→0) |
| 22 | File & Media | applied | **Ditambah gambar di dalam isi artikel (2026-07-29).** Pipeline-nya sama persis dengan cover — hanya raster sungguhan yang lolos, re-encode ke WebP, EXIF termasuk titik GPS dibuang — jadi tidak ada jalur unggah kedua dengan penjagaan yang lebih longgar. Path `isi/<uuid>.webp`, sengaja **tidak** memakai slug seperti cover: gambar disisipkan saat mengetik, dan pada artikel baru belum ada slug apa pun. Policy Storage bucket-scoped (diperiksa di `pg_policies`), jadi awalan baru itu tidak butuh migrasi. **Gambar yatim dibuang saat simpan, SETELAH dokumen barunya tersimpan** — urutan sebaliknya menghapus gambar yang masih dipakai bila penyimpanan gagal di tengah; hanya path berawalan `isi/` yang disentuh, karena cover punya siklus hidupnya sendiri. Hapus permanen ikut membuang gambar isi, kalau tidak berkasnya tertinggal di bucket selamanya tanpa satu pun dokumen yang bisa dipakai menemukannya. **Cover juga tidak lagi menunggu "simpan dulu"**: berkasnya ikut pengiriman formulir dan diunggah tepat setelah baris artikelnya lahir. Bucket `post-covers`: batas 5MB, MIME dibatasi ke jpeg/png/webp/avif (**SVG sengaja dilarang** — bisa memuat script), disajikan dari `<ref>.supabase.co` yakni origin terpisah dari aplikasi. `src/lib/covers.ts` melakukan cek **berbasis isi** (harus benar-benar terdekode sebagai raster), auto-rotate lalu re-encode ke webp yang sekaligus membuang EXIF/GPS, dengan `limitInputPixels` sebagai penangkal decompression bomb. Terverifikasi 5/5: gambar asli lolos, EXIF terbukti hilang, teks menyamar ditolak, SVG ditolak, anon ditolak saat unggah. Anon juga tidak bisa mendaftar isi bucket (migrasi `0004`). **Jalur unggah admin sudah ada** (`uploadCover` di `artikel/actions.ts`), dan pipeline-nya diuji langsung 12/12 pada 2026-07-27: JPEG ber-EXIF 252 byte keluar sebagai WebP 1600px tanpa EXIF/XMP dan tanpa jejak string metadata di byte keluarannya; teks menyamar → `not-an-image`; SVG → `unsupported-format`; 320px → `too-small`; >5MB → `too-large`. **Sisa: satu unggahan nyata lewat UI dasbor** |
| 25 | Authentication | applied | Supabase Auth email+password, kunci publishable saja, sesi cookie lewat `@supabase/ssr`. Masuk dijalankan sebagai Server Action, bukan klien browser — formulir tetap jalan tanpa JavaScript dan pembatas laju berjalan sebelum kredensial sampai ke GoTrue. Middleware menyegarkan sesi khusus jalur `/admin` (token berumur 1 jam; Server Component tidak boleh menulis cookie). Terverifikasi: `/admin` tanpa sesi → 307 ke `/admin/masuk?lanjut=…`; kredensial salah → satu pesan generik; login berhasil 2026-07-27 12:24 UTC dan `auth.users.last_sign_in_at` berubah dari null. **Sisa: signup publik dimatikan lewat dashboard Supabase (tindakan manual)** |
| 26 | Permissions & Access Control | applied | Tiga lapis, dan yang ketiga tidak bergantung pada kode aplikasi sama sekali: (1) gate layout `(dasbor)`, (2) `requireAdmin()` di baris pertama **setiap** Server Action — perlu karena layout tidak dijalankan sebelum action, (3) RLS. Terverifikasi: POST Server Action dengan `Next-Action` valid tanpa cookie → 307, kodenya tidak pernah jalan; kunci anon lewat REST langsung → `posts` `[]` padahal ada 4 baris, `rate_limits` `[]`. **Catatan jujur: lapis 2 belum diuji terpisah** — membuktikannya butuh sesi valid milik akun non-admin, dan itu tidak dilakukan |
| 27 | Security & SSL | applied | **Aturan nol `dangerouslySetInnerHTML` bertahan melewati perubahan format isi (2026-07-29), dan caranya layak dicatat.** Editor kaya biasanya menyeret HTML tersimpan, yang menuntut sanitizer sendiri — persis risiko yang dihindari situs ber-`+public-ugc`. Karena isi disimpan sebagai **pohon bertipe**, penjagaannya jadi daftar putih di `src/lib/doc.ts`: tipe node dan mark tak dikenal **dibuang**, bukan di-escape. Dua lapis saling menutup — `sanitizeDoc()` menolak sebelum masuk database, dan renderer `post-doc.tsx` tidak punya cabang untuk merender node asing seandainya ada yang lolos. `href` dibatasi `http(s):`/`mailto:`/`/`; `javascript:` berubah jadi eksekusi kode saat diklik, dan itu tetap berlaku meski seluruh isi lain aman. Dibersihkan **di server** meski editor juga membersihkan di peramban — yang di peramban kenyamanan, yang menentukan yang di server, karena dokumen sampai sebagai string JSON di dalam FormData. Terverifikasi 22/22, termasuk bahwa `javascript:` tidak pernah sampai ke HTML hasil render. CSP `/admin` tidak perlu dilonggarkan: `img-src` sudah memuat `blob:` dan `style-src` sudah `unsafe-inline`. Enam header global terpasang dan terbukti terkirim (`Strict-Transport-Security` 2 tahun + preload, `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, `X-DNS-Prefetch-Control`), diset di `next.config.ts` agar berlaku juga saat `next dev`. CSP penuh khusus `/admin/*` — bisa ditegakkan justru karena dasbor tidak memasang `next-themes`; origin Supabase diturunkan dari env var. Nol `dangerouslySetInnerHTML` di seluruh permukaan dasbor: pratinjau artikel lewat `<PostBody>` yang membangun elemen React. **Sisi publik sengaja tanpa CSP** — script tema inline dan JSON-LD butuh nonce per-permintaan, dan merusak situs live berskor Lighthouse 100 demi satu kotak centang adalah pertukaran yang salah. **Reopen: nonce CSP publik; tinjau permukaan prompt-injection di langkah 4** |
| 28 | Rate Limiting | applied | Penghitung di Postgres (`rate_limits` + `consume_rate_limit()`, migrasi `0005`), bukan memori proses — fungsi serverless tidak berbagi memori antar instance, jadi `Map` in-memory praktis tidak membatasi apa pun. Jendela tetap, satu pernyataan atomik. Batas: masuk 10/IP dan 5/email per 15 menit, unggah cover 20/jam, simpan 120/jam. Terverifikasi dua tingkat: fungsi DB mengembalikan true,true,true,**false**,false; dan lewat UI, satu percobaan gagal menulis dua bucket ter-hash, lalu setelah dipaksa lewat batas pesannya berubah jadi "Terlalu banyak percobaan" — membuktikan limiter berjalan **sebelum** GoTrue. Komentar (migrasi 0006) memakai tiga ember di dalam `post_comment()`: 5 per pengunjung per 10 menit, 30 per artikel per jam, 100 di seluruh situs per jam. Pembagiannya disengaja — ember per-pengunjung memakai penanda yang bisa dibuang dan dibuat ulang, jadi yang benar-benar menahan penyalahgunaan adalah ember per-artikel dan global, dan keduanya tidak bisa dipalsukan. Terverifikasi lewat kunci anon: komentar ke-6 dari satu pengunjung ditolak `terlalu-cepat`. **Reopen: pembatas biaya terjemahan, langkah 4** |
| 29 | Env & Secrets | applied | `.env.example` sudah ada dan ikut repo (pengecualian `!.env.example` ditambahkan ke `.gitignore`, karena pola `.env*` tadinya ikut mengabaikannya). `.env.local` terbukti diabaikan git. `src/lib/supabase/env.ts` menggagalkan startup bila variabel hilang. Service key Supabase **sengaja tidak pernah diambil** — aplikasi memakai kunci publishable + RLS saja. Ditambah `RATE_LIMIT_SALT` (opsional) — tanpa salt, hash sha256 dari sebuah alamat IPv4 masih bisa dibalik dengan mencoba seluruh ruang alamat, jadi kolom `bucket` menyamarkan tapi tidak menganonimkan; tabelnya sendiri tak terbaca lewat REST dan barisnya dihapus setelah sehari, sehingga ketiadaannya bukan lubang melainkan satu lapis yang hilang. `ANTHROPIC_API_KEY` diganti `OPENROUTER_API_KEY` di langkah 4, beserta `OPENROUTER_MODEL`, `OPENROUTER_PROVIDER_ORDER`, dan dua plafon token — semuanya terdokumentasi di `.env.example` tanpa satu pun nilai asli. Tidak ada rahasia baru yang berawalan `NEXT_PUBLIC_`. Konfigurasi terjemahan dibaca **malas**, bukan divalidasi saat startup seperti Supabase: tanpa kuncinya situs tetap jalan penuh dan fitur terjemahannya sekadar tidak aktif — menggagalkan startup karena fitur opsional belum dikonfigurasi adalah kerusakan yang tidak perlu. Ditambah `NEXT_PUBLIC_FORMSPREE_ID` (opsional, sengaja publik — ID itu wajib tampil di atribut `action`). **DITUTUP 2026-08-04.** `DEEPL_API_KEY` dipasang pemilik di Vercel dan deploy ulang dijalankan (2026-07-29) — dilaporkan pemilik, bukan diverifikasi dari sini, karena membuktikannya butuh sesi admin. Sisanya opsional dan sengaja dibiarkan kosong, masing-masing gagal dengan aman: `NEXT_PUBLIC_FORMSPREE_ID` kosong (**diverifikasi dari luar 2026-08-04: nol string `formspree` di HTML produksi**), jadi bagian kontak menampilkan tombol Kirim email; `RATE_LIMIT_SALT` kosong, jadi hash IP tak bergaram. Catatan lama sebelum penutupan: `DEEPL_API_KEY` kosong, jadi tombol terjemahan menjawab "belum dikonfigurasi"; `NEXT_PUBLIC_FORMSPREE_ID` kosong, jadi formulir kontak tidak dirender; `RATE_LIMIT_SALT` kosong, jadi hash IP tak bergaram. **Jumlah env var terjemahan turun dari lima jadi satu yang wajib** — host diturunkan dari akhiran kunci alih-alih dikonfigurasi, dan plafon per-permintaan hilang bersama satuan token. Makin sedikit yang bisa diisi, makin sedikit yang bisa diisi salah. **`.env.local` masih memuat `OPENROUTER_API_KEY` berisi kunci asli yang kini tak terpakai** — file itu diabaikan git, jadi tidak pernah bocor lewat repo, tapi kunci yang sudah tidak dipakai sebaiknya **dicabut di OpenRouter**, bukan sekadar dihapus dari file. Menghapus barisnya hanya menghilangkan salinannya; yang mencabut aksesnya cuma pencabutan di sisi provider. Ketiganya gagal dengan aman dan tidak ada yang perlu ditulis di kode lagi — yang kurang hanya nilainya. **Dibuktikan dari luar 2026-07-28, bukan diasumsikan:** setelah deploy `2de7b09`, `salsabilah.vercel.app/id` merender **0 elemen `<form>`** dan menampilkan tombol `mailto` — artinya `NEXT_PUBLIC_FORMSPREE_ID` memang belum ada di Vercel. Nilai yang diisi pemilik masuk ke `.env.example`, file yang tidak dibaca Next.js sama sekali; `.env.local` sudah dibetulkan sehingga lokal jalan, tapi **produksi hanya berubah lewat Vercel → Settings → Environment Variables.** Cara memeriksanya kapan pun tanpa membuka dasbor Vercel: kalau bagian Kontak menampilkan formulir, env var-nya ada; kalau menampilkan tombol Kirim email, belum. **Catatan: `.env.local` juga masih memuat `ANTHROPIC_API_KEY` yang sudah tidak dibaca kode mana pun sejak provider pindah ke OpenRouter; tidak berbahaya, tapi menyesatkan orang yang membacanya** |
| 34 | AI / Terjemahan Mesin | applied | **Provider: DeepL** (menggantikan OpenRouter, 2026-07-28, atas permintaan pemilik). Seluruh alur bicara ke adapter `src/lib/translate/provider.ts`. **Bentuk adapternya ikut diubah, dan itu koreksi atas klaim lama:** versi OpenRouter berbentuk `{system, user, maxOutputTokens}` — antarmuka *chat*, bukan *terjemahan* — sehingga klaim "pindah provider berarti menulis satu file" ternyata tidak benar; abstraksinya terlanjur miring ke provider pertama. Bentuk sekarang (`{texts[], sourceLang, targetLang}`) bicara dalam istilah pekerjaannya sendiri. **Tiga risiko hilang, bukan diperkecil:** (1) **tidak ada prompt**, jadi permukaan prompt-injection lenyap — penanda `ARTIKEL_MULAI`/`ARTIKEL_SELESAI` tidak lagi dibutuhkan karena tidak ada instruksi yang bisa dibajak; (2) **tidak ada JSON**, jadi penguraian defensif tidak dibutuhkan — empat kolom dikirim sebagai empat teks dan kembali sebagai empat teks, dan **adapter menolak bila jumlahnya tidak sama**, karena pemetaan hasil ke kolom bersandar sepenuhnya pada urutan; (3) **tidak ada anggaran token**, jadi cacat `finish_reason: "length"` yang terukur pada OpenRouter tidak punya padanan. **Glosarium ditegakkan lewat `missingTerms()` terhadap hasil** — persis bunyi K2, dan itu **kembali** ke sana setelah jalan pintas yang tampak lebih kuat terbukti merusak. Percobaan pertama membungkus istilah dalam `<x>…</x>` dengan `tag_handling=xml` + `ignore_tags`, supaya pelanggaran jadi mustahil alih-alih terdeteksi. Panggilan sungguhan membatalkannya: DeepL memperlakukan tag itu sebagai penanda **struktur**, sehingga artikel 26 baris keluar 62 baris, blok daftar pecah (tujuh butir terender jadi tiga), spasi di sekitar tag dilahap (`menyergap kelulut` → `ambushingkelulut`, `Madu kelulut` → `Honeykelulut`), dan perlindungannya **tetap bocor** — `## Pemangsa kelulut` tetap keluar `Predators of stingless bees`. `non_splitting_tags` memperbaiki spasinya saja. Teks polos unggul di ketiganya sekaligus: **9 dari 9 istilah bertahan tanpa satu pun parameter** (`kelulut` 3×, `propolis` 2×, `bee bread` 2×, enam takson 1× masing-masing), dan struktur `<ul>/<li>/<h2>` hasil render sisi Inggris **identik** dengan sisi Indonesia. Yang tersisa dari permintaan: `preserve_formatting=true` dan `show_billed_characters=true`. Glosarium native DeepL tidak dipakai — dokumentasinya menandai pasangan Indonesia tidak didukung. **Pelajaran yang lebih luas: pencegahan tidak otomatis lebih baik daripada pemeriksaan. Mekanisme pencegah yang menyentuh teks bisa merusak apa yang tidak dijaganya, dan `missingTerms()` tidak akan menangkapnya — istilahnya utuh, kalimat di sebelahnya yang hancur.** **Host tidak dikonfigurasi manual**: diturunkan dari akhiran kunci (`:fx` → Free), supaya kombinasi kunci-Free-ke-host-Pro yang menjawab `403` tidak bisa terjadi. **Percobaan ulang dibatasi satu kali dan hanya untuk kegagalan sementara**; kuota habis (HTTP 456) dibedakan dari kunci ditolak (403), karena yang satu menyuruh menunggu bulan depan dan yang satu menyuruh memeriksa kunci. **Mesin tidak pernah menentukan otorisasi** — `translation_status` hasilnya selalu `generated`. Varian mesin yang benar-benar melayani dicatat per baris dari `model_type_used` di respons. **Terverifikasi lewat panggilan sungguhan ke DeepL** (2026-07-28, kunci Free `:fx`) memakai artikel nyata pertama: host Free terpilih otomatis, kunci diterima, `billed_characters` 1576 untuk sumber 1576 karakter, 26 baris masuk → 26 baris keluar, 7 baris daftar tetap 7, nol istilah glosarium hilang, dan keenam nama takson tetap miring. Satu penanda miring hilang — `*assassin bug*`, glosa yang memang hanya perlu bagi pembaca Indonesia. **Dua cacat ditemukan dan ditutup pada panggilan itu, keduanya mustahil terlihat dari respons tiruan:** (1) tanpa `show_billed_characters`, DeepL **menghilangkan** `billed_characters` dari respons — bukan mengembalikan nol — sehingga `?? 0` mencatat nol pada setiap baris dan plafon bulanan tidak akan pernah menyala; (2) kerusakan `tag_handling` di atas. **Diperbarui 2026-07-29 — isi artikel kini dokumen, dan strukturnya tetap TIDAK pernah dikirim.** `collectTexts()` mengambil potongan teks berurutan, DeepL menerjemahkannya sebagai array, `applyTexts()` memasang kembali per indeks. Pelajaran `tag_handling` karena itu tidak berlaku lagi: tidak ada markup yang bisa dirusak provider, karena tidak ada markup yang dikirimkan. Panjang tidak cocok → dokumen ditolak seluruhnya; memasang sebagian menghasilkan artikel separuh dua bahasa dengan struktur utuh, kerusakan yang tampak sepenuhnya sah sampai ada yang membacanya. **Batching wajib**: DeepL menerima maksimal 50 teks per permintaan, dan satu artikel bisa punya ratusan node (tiap sel tabel, tiap butir daftar, tiap potongan tebal adalah node tersendiri). Batch dijalankan **berurutan, bukan paralel** — urutan itulah satu-satunya yang memetakan hasil ke posisinya. Terverifikasi lewat panggilan sungguhan: 61 teks → 2 batch, hitungan node ID dan EN identik, `altId` tidak tersentuh, `altEn` terisi. **Pemicunya kini tombol Preview** (`translateFormContent`), yang menerjemahkan isi formulir tanpa menyentuh tabel `posts` — jalur lama menuntut `postId` sehingga tidak pernah bisa dipakai di layar artikel baru. Jalur lama `generateTranslationDraft` dihapus, bukan dibiarkan: dua jalur yang satu menulis DB dan satu mengisi formulir membuat hasil tersimpan bisa berbeda dari yang terlihat di layar. **Dua batas yang diukur, bukan diasumsikan:** (1) `missingTerms()` memeriksa istilah **di mana pun** dalam terjemahan, bukan per kemunculan — `"Lebah kelulut"` yang keluar sebagai `"Stingless bees"` tetap lulus karena `kelulut` muncul di paragraf lain; mengetatkannya jadi per-kemunculan akan menolak hampir setiap draft, karena jumlah kemunculan wajar berubah antar bahasa. Ia menangkap istilah yang hilang **total**, bukan yang hilang sebagian. (2) Sel tabel kehilangan konteks — `"Kelompok lebah"` keluar `"A swarm of bees"` — karena tiap sel dikirim sebagai potongan berdiri sendiri. Itu harga dari tidak mengirim struktur, dan tetap dipilih; alternatifnya sudah terbukti merusak paragraf. Perbaikan yang mungkin: parameter `context` DeepL, belum dipasang karena perlu diukur. **Sisa: `DEEPL_API_KEY` baru ada di `.env.local`, belum di Vercel** — gate #29 masih terbuka, dan produksi belum pernah menerjemahkan apa pun |
| 38 | Cache & CDN | applied | Terpasang di CDN Vercel sejak deploy 2026-07-26. One-pager tetap statis; rute blog dan sitemap memakai ISR `revalidate = 60`, dan cache data Supabase diselaraskan ke jendela yang sama (lihat catatan jebakan di bawah). Aset `_next/static` dilewati matcher middleware sehingga tidak menambah hop |
| 46 | Error Handling | applied | 404 khusus sudah ada sejak sebelumnya. Ditambah 2026-07-27: `src/app/[locale]/error.tsx` (sadar bahasa, tombol `reset()`, menampilkan `digest` sebagai satu-satunya jalan mencocokkan layar dengan log Vercel) dan `src/app/admin/error.tsx` + `loading.tsx`. **`loading.tsx` untuk rute blog sengaja TIDAK ada** — lihat jebakan soft 404 di bawah. Fallback provider terjemahan selesai di langkah 4: timeout 90 detik lewat `AbortController`, kegagalan diklasifikasi jadi `sementara` / `kredensial` / `permanen`, dan hanya yang sementara diulang — sekali. Setiap kegagalan mendarat sebagai kalimat Indonesia yang bisa ditindaklanjuti plus baris di `translation_runs`; pesan provider mentah tidak pernah sampai ke layar, karena bisa memuat potongan prompt dan prompt memuat tulisan Salsabilah. Saat provider mati, menulis terjemahan manual tetap jalan. **Ditambah 2026-07-28 (audit kedua):** kegagalan diam formulir kontak ditutup. Endpoint Formspree yang di-hardcode `REPLACE_ME` menjawab 404, dan karena formulir HTML biasa hanya berpindah halaman setelah POST, pengunjung mendarat di halaman galat pihak ketiga sementara pesannya hilang — nol umpan balik dari sisi situs ini, dan nol cara mengetahui berapa pesan yang sudah hilang. Sekarang endpoint dibaca dari `NEXT_PUBLIC_FORMSPREE_ID`, dan **bila kosong formulirnya tidak dirender sama sekali** — yang tampil tombol `mailto` ke alamat yang memang sudah tercantum di atasnya. Terverifikasi kedua arah pada build produksi: tanpa env var, `#contact` berisi 0 elemen `<form>` dan tidak ada string `formspree` maupun `REPLACE_ME` di HTML; dengan env var terisi, tepat 1 `<form>` dengan `action="https://formspree.io/f/<id>"`, `method=POST`, dan tiga kolom `required`. **Endpoint tujuannya juga diverifikasi hidup 2026-07-28**, atas izin pemilik, lewat satu submission bertanda `[UJI TEKNIS]`: `POST /f/meeynobq` → `200 {"ok":true}`, sementara kontrol dengan ID palsu → `404 FORM_NOT_FOUND` — galat yang sama persis dengan yang dulu diterima setiap pengunjung. Kontrolnya penting: `GET` tidak bisa membedakan form hidup dari form yang tidak ada (keduanya `405`), jadi tanpa POST verifikasinya akan kosong. Ditambah pula: bila nilai env var-nya berbentuk URL lengkap alih-alih ID, ID-nya dinormalkan; kalau setelah itu masih ada garis miring, formulir sengaja tidak dirender — menolak lebih baik daripada mengirim pesan pengunjung ke alamat yang belum tentu ada |
| 50 | Admin / Back-office | applied | Moderasi komentar ada di `/admin/komentar`: tab Tayang/Dihapus/Semua, hapus lunak dan pulihkan, isi komentar dirender sebagai teks. Tidak ada jalur hapus permanen komentar — kalau kelak dibutuhkan, ia harus meniru pola artikel (hanya untuk yang sudah dihapus lunak, dengan konfirmasi diketik). Sisi artikel **selesai** sejak langkah 3: `/admin` (daftar dengan tab Semua/Draf/Terjadwal/Terbit/Arsip), `/admin/artikel/baru`, `/admin/artikel/[id]` — tulis, sunting, slug otomatis, unggah cover, tinjau terjemahan, simpan draf, jadwalkan, terbitkan, tarik, arsipkan, pulihkan, hapus permanen. Semua mutasi lewat Server Action, nol route `/api/*` baru (CSRF ditangani pemeriksaan `Origin` bawaan Next). Semua mutasi lewat Server Action, nol route `/api/*` baru |

## Recommended

| # | Competency | Status | Evidence / reason |
|---|---|---|---|
| 1 | Requirements & Scoping | applied | Build spec awal + 13 kriteria sukses terverifikasi; K1–K8 di atas menutup scope blog |
| 7 | Frontend | applied | **Editor artikel diganti total 2026-07-29**: dari kotak teks bertanda baca jadi editor ber-toolbar (`rich-editor.tsx`) — tebal, miring, garis bawah, coret, subskrip/superskrip, H2/H3, daftar berpoin dan bernomor, kutipan, tautan, garis pemisah, tabel, gambar, urungkan/ulangi. Tata letak formulir ikut disusun ulang atas permintaan pemilik: cover pindah ke depan, slug ke paling bawah, dan sisi bahasa bukan-sumber disembunyikan sampai Preview ditekan. Komponen per-section di `src/components/`, ditambah `src/components/admin/`. Error state rute blog dan loading/error state dasbor sudah ada (lihat #46); daftar artikel punya empty state terpisah untuk "belum ada artikel" dan "tab ini kosong". Rute blog sengaja tanpa `loading.tsx` karena akan merusak status 404-nya |
| 9 | Application State | applied | `next-themes` + `useState` lokal; tanpa sumber kebenaran ganda |
| 10 | Accessibility | applied | Lighthouse Accessibility 100 di `/en` dan `/id`. Form dasbor dibangun lewat `<Field>` yang menautkan label, petunjuk, dan galat secara eksplisit (`htmlFor`, `aria-describedby`, `aria-invalid`); ringkasan galat `role="alert"` menerima fokus setelah simpan gagal; kolom dua bahasa dibungkus `<fieldset>`/`<legend>`. **Reopen: audit axe pada dasbor belum dijalankan; form komentar Fase 2** |
| 14 | APIs & Backend Logic | applied | Server Action, bukan route handler — CSRF ditangani Next, tidak ada endpoint admin yang bisa ditebak, dan formulir tetap jalan tanpa JavaScript. Kontrak tunggal `ActionResult` di `src/lib/admin/guard.ts` dikonsumsi lewat `useActionState`. `src/lib/admin/errors.ts` memetakan kode Postgres ke kalimat Indonesia (`23505` → slug bentrok, `23514` → syarat terbit belum lengkap, `42501`/`PGRST301` → sesi tidak berwenang); pesan aslinya tidak pernah sampai ke browser, hanya ke log server — nama tabel dan constraint adalah peta skema gratis bagi yang memancing error |
| 15 | Database & Storage | deferred | Koneksi jalan dan terbukti: `src/lib/supabase/{env,server,client}.ts`; 6/6 pemeriksaan RLS lulus dengan kunci publishable. Pooling ditangani Supabase. Indeks terpasang pada slug, status+published_at, category_id, dan dua indeks GIN untuk FTS. **Sisa: bucket Storage untuk cover image. Reopen: langkah 2** |
| 17 | Migrations | applied | Migrasi berversi di `supabase/migrations/` dan ikut ter-commit, kini sampai `0011_dokumen_kaya.sql`. **`0010` menjatuhkan kolom `input_tokens`/`output_tokens` dan menggantinya dengan `billed_characters`** — penggantian penuh, bukan penambahan, dan itu aman **hanya karena `translation_runs` diperiksa kosong (0 baris) sebelum migrasi ditulis**. Alasannya tertulis di dalam filenya: kalau tabel ini kelak sudah berisi, migrasi serupa wajib menambah kolom dan menyimpan yang lama. Menyimpan angka DeepL di kolom bernama `output_tokens` akan membuat setiap pembacaan tabel ini salah tafsir selamanya. Diverifikasi 2026-07-28: `supabase_migrations.schema_migrations` memuat tepat 8 baris dengan nama yang sama persis dan urutan yang sama seperti kedelapan file — tidak ada migrasi yang diterapkan di luar repo, dan tidak ada file yang belum diterapkan. Isi file identik dengan yang diterapkan ke database, **dengan satu pengecualian tercatat:** percobaan penerapan pertama `0006` putus karena connector timeout (tidak ada yang tersisa separuh jalan — seluruh DDL ter-rollback, sudah diperiksa), lalu dikirim ulang dalam bentuk tanpa komentar. Pernyataannya identik urutan dan isinya; komentar penjelasnya hanya ada di file. Kalau database ini kelak dibangun ulang dari migrasi, jalankan file-nya — hasilnya sama |
| 23 | Queues & Async | applied | **Tidak ada cron, dan itu jawabannya.** `post_is_live()` sudah memeriksa `published_at <= now()` dan bersifat `stable`, jadi baris berstatus `published` dengan tanggal masa depan sudah berada dalam keadaan finalnya — RLS menyembunyikannya sampai waktunya lewat. Tidak ada UPDATE yang perlu dijalankan di batas waktu, sehingga pertanyaan "bagaimana cron menulis di bawah RLS tanpa service key" tidak pernah muncul. Yang terjadi di batas waktu hanyalah kedaluwarsa cache ISR (≤ ~2 menit). Terverifikasi 2026-07-27: artikel diterbitkan tanpa build ulang, `/id/blog` dan `/id/blog/<slug>` keduanya live dalam 20 detik. Kalau kelak benar-benar butuh penulisan terjadwal, urutan pilihannya: `pg_cron` (tersedia, belum terpasang; berjalan di dalam Postgres sehingga tidak melewati PostgREST maupun RLS) — bukan RPC `security definer` berpenjaga secret, dan bukan menyimpan refresh token admin di env |
| 30 | Dependency & Supply Chain | applied | `npm audit --omit=dev` → **0 kerentanan**, diperiksa ulang 2026-07-29 setelah 12 paket TipTap masuk. Itu penambahan dependensi terbesar sejak proyek berdiri, dan satu-satunya alasan ia diterima: bundelnya **tidak menyentuh sisi pembaca** — `/[locale]/blog/[slug]` tetap 124 kB sebelum dan sesudah, karena `PostDoc` dirender di server tanpa JavaScript klien. Yang naik hanya `/admin` (109 → 253 kB), halaman yang tidak dinilai Lighthouse dan hanya dibuka satu orang. Sebelumnya: 0 kerentanan (2026-07-09). Ditutup dengan `next@15.5.22` plus `overrides` di `package.json` yang memaksa `postcss@^8.5.23` dan `sharp@^0.35.3` — bump `next` saja ternyata tidak cukup karena advisory-nya menyasar dua dependensi bawaan itu. Lockfile ter-commit. **Catatan:** `overrides` harus ditinjau ulang setiap kali `next` di-upgrade, kalau-kalau sudah tidak diperlukan |
| 35 | Hosting & Deployment | applied | Live di `https://salsabilah.vercel.app` (project `prj_NFoCWbLv3XKCftBfKMONveSUFKkT`). Deploy otomatis tiap push ke `master`; build commit `5866677` selesai 50 detik. **Rollback:** Vercel → Deployments → pilih deployment lama bertanda *rollback candidate* → Promote to Production; deployment sebelumnya (`dpl_5cgx…`) masih tersedia sebagai titik balik |
| 42 | Code Quality Automation | deferred | ESLint + TypeScript jalan saat build, belum dipaksakan otomatis. **Reopen: bersama CI** |
| 43 | Automated Testing | deferred | **Naik lagi kepentingannya 2026-07-29.** Uji yang dijalankan hari ini — 22/22 untuk daftar putih dokumen dan renderer, 20/20 untuk glosarium, plus dua panggilan DeepL sungguhan — semuanya lewat skrip sementara yang **dihapus setelah dijalankan**. Buktinya ada di ledger dan pesan commit, bukan di repo, jadi tidak ada yang menjalankannya ulang saat kode berikutnya menyentuh `sanitizeDoc()`. Itu tepat jenis penjagaan yang paling rugi kalau hilang: daftar putihnya adalah pengganti sanitizer. Naik kepentingannya: penyaringan draft, fallback bahasa, dan otorisasi admin adalah logika yang layak diuji. **Reopen: Fase 1** |
| 44 | Logging & Monitoring | deferred | Belum ada uptime check maupun pelacakan 404. **Reopen: setelah deploy; wajib setelah perubahan struktur URL** |
| 48 | Backup & Recovery | deferred | Repo ter-push ke GitHub (`master` sinkron dengan origin), tapi **isi database belum tercakup**. Butuh backup DB + satu kali uji restore. **Reopen: setelah artikel asli pertama masuk** |
| 49 | Bus Factor & Continuity | deferred | Kredensial Supabase, API key, akses domain belum dicatat di tempat aman. **Reopen: saat deploy** |
| 51 | Product Analytics | applied | `<Analytics />` terpasang di root layout; script terverifikasi ada di DOM |
| 37 | CI/CD | deferred | Vercel build otomatis saat push; belum ada pipeline lint/test. **Reopen: bersama test** |
| 20 | Idempotency & Concurrency | applied | Like dedup lewat primary key gabungan `(post_id, visitor_hash)` dari migrasi 0001, dan `toggle_like()` yang menyalakan/mematikan alih-alih menambah. Terverifikasi: tiga panggilan berturut-turut dengan penanda sama menghasilkan `suka` → `batal` → `suka`, dan `posts.like_count` tetap sinkron dengan jumlah baris `likes` |

## Deferred by decision

| # | Competency | Reason | Reopen when |
|---|---|---|---|
| 3 | Architecture Decision Records | Project solo; keputusan besar tercatat di ledger ini | Ada kontributor kedua |
| 4 | Client & Stakeholder Management | Komunikasi langsung dengan pemilik situs | Ada tenggat pihak ketiga |
| 33 | Transactional Email | Tidak mengirim email atas nama domain sendiri. Form kontak diserahkan ke Formspree — dan selama `NEXT_PUBLIC_FORMSPREE_ID` kosong, tidak ada form sama sekali: pengunjung diarahkan ke `mailto`, yang berarti email dikirim dari klien mereka sendiri dan situs ini tidak pernah menyentuh satu pun pesan | Butuh notifikasi email (mis. pemberitahuan komentar baru), atau butuh pesan kontak tersimpan/terbalas dari sisi situs |
| 39 | Scalability | Trafik blog personal | Ada lonjakan trafik nyata |
| 40 | Feature Flags | K7 (sembunyikan blog sampai ada artikel) sudah jadi saklar alaminya | Ada fitur berisiko lain |
| 41 | Local Dev Reproducibility | `npm install && npm run dev` cukup | Digabung dengan perbaikan README (#2); butuh `.env.example` |
| 45 | Tracing & Correlation ID | Beban berlebih untuk satu penulis | Debugging lintas layanan jadi sulit |
| 47 | Availability & Incident | Situs pribadi tanpa SLA | Jadi kanal resmi institusi |

## Not applicable

| # | Competency | Why |
|---|---|---|
| 24 | Multi-tenancy | Situs satu pemilik, satu penulis |
| 31 | Webhooks | Tidak menerima webhook dari pihak ketiga |
| 32 | Payments & Billing | Tidak ada transaksi; tidak ada paywall |
| 36 | Cloud & Infrastructure | Sepenuhnya managed (Vercel + Supabase) |

---

## Jebakan yang dipantau terus

**Dari kategori `content`:** slug tidak pernah berubah tanpa redirect 301 · draft tidak boleh
punya URL yang bisa ditebak · pencarian tidak memakai `LIKE '%x%'` · `published_at` disimpan UTC
dan ditulis dalam WIB.

**Dari `+public-ugc`:** jangan pernah percaya sanitizer sisi klien · unggahan tidak disajikan dari
origin aplikasi · komentar yang dihapus disimpan dulu (soft delete), tidak dihapus permanen.

**Cache data Next.js (ditemukan 2026-07-09, sudah diperbaiki):** secara default Next men-cache
`fetch` yang dipakai supabase-js **tanpa batas waktu**, sehingga halaman ber-`revalidate` tetap
membaca respons basi — artikel yang baru terbit tidak akan pernah sampai ke homepage.
`createPublicClient()` kini menyetel `next: { revalidate: 60 }` pada setiap fetch. Jangan
diganti `cache: "no-store"`: itu memang menyegarkan data tapi memaksa seluruh rute jadi dinamis
dan mematikan SSG (build gagal ketika dicoba).

**`NoFallbackError` pada `blog/[slug]` (ditemukan 2026-07-27, sudah diperbaiki):** `generateStaticParams`
yang mengembalikan daftar kosong — keadaan setiap build sebelum artikel pertama terbit — membuat
Next tidak membuat fallback untuk rute itu, dan setiap permintaan mati di dalam router dengan
`Error: Internal: NoFallbackError` sebelum komponennya jalan. Gejalanya cuma 404. Dua hal rusak
sekaligus: artikel pertama yang Salsabilah terbitkan tidak bisa dibuka sampai ada push yang memicu
build ulang (dan menerbitkan tidak melakukan push), dan redirect 301 slug lama ikut mati karena
logikanya ada di dalam komponen itu. Begitu ada ≥1 slug ter-prerender masalahnya lenyap — itu yang
membuatnya mudah terlewat. `generateStaticParams` dihapus; rute jadi `ƒ` dengan ISR 60 detik.
**Jangan menambahkannya kembali.**

**"Terbitkan sekarang" vs kolom tanggal (ditemukan 2026-07-27, sudah diperbaiki):** tombolnya dulu
menghormati isi kolom tanggal, jadi tanggal masa depan membuat artikel terjadwal — padahal
tombolnya bertuliskan "sekarang". `publishNowDate()` di `src/lib/admin/publish.ts` menimpa tanggal
masa depan dengan waktu sekarang, tapi mempertahankan tanggal masa lalu supaya menerbitkan ulang
artikel lama tidak memalsukannya jadi baru. Terverifikasi 5/5.

**`anon` bisa INSERT komentar langsung, melewati seluruh mitigasi (ditemukan 2026-07-28, sudah
diperbaiki):** migrasi 0001 menulis bahwa rate limit, honeypot, dan heuristik tautan "live in the
route handler; this is the last line, not the first". Asumsi itu keliru — `anon` punya grant INSERT
pada `comments` dan `likes`, dan kunci publishable ada di source setiap halaman, jadi satu `curl` ke
`/rest/v1/comments` melewati aplikasi sepenuhnya. Untuk komentar tanpa antrean moderasi, artinya
spam langsung tayang. Migrasi 0006 mencabut grant itu dan memindahkan seluruh aturan ke dalam
`post_comment()` dan `toggle_like()`. **Pelajaran yang lebih luas: policy RLS yang mengizinkan
INSERT dari `anon` bukan "lapis terakhir" — ia satu-satunya lapis bagi lalu lintas yang tidak lewat
aplikasi.**

**Rate limit tidak boleh memakai IP yang dilihat database.** Permintaan dari situs ini sampai ke
Postgres lewat server Vercel, jadi `request.headers` di sisi database menunjukkan IP yang sama untuk
semua pengunjung. Memakainya sebagai kunci pembatas akan membuat satu orang berkomentar memblokir
semua orang. Itu sebabnya penanda pengunjung dibuat di peramban, dan ember per-artikel yang
memikul beban penahanan.

**Klien Supabase di peramban itu mahal.** Memuat komentar langsung dari peramban menambah **70 kB**
First Load JS pada halaman artikel (120 → 190 kB) — halaman yang paling menentukan skor performa.
Dipindahkan ke Server Action, turun lagi ke 124 kB. Kalau kelak ada fitur yang tergoda memakai
`createBrowserClient`, ukur dulu.

**`loading.tsx` mengubah 404 jadi soft 404 (ditemukan 2026-07-27, sudah diperbaiki):** menambahkan
`src/app/[locale]/blog/loading.tsx` membuat Suspense boundary, sehingga respons mulai di-stream
dengan status 200 sebelum `notFound()` sempat dipanggil — status tidak bisa diubah setelah byte
pertama terkirim. Akibatnya `/id/blog` menyajikan **isi halaman 404 dengan status 200**, persis
pola yang dihukum mesin pencari, dan sekaligus membatalkan klaim status 404 benar di #11. File itu
dihapus. **Jangan menambahkan `loading.tsx` pada rute mana pun yang memanggil `notFound()`.**
`src/app/admin/loading.tsx` dibiarkan: `/admin/artikel/[id]` juga memanggil `notFound()` dan
karenanya ikut menghasilkan soft 404, tapi seluruh `/admin` sudah `noindex` sehingga tidak ada
mesin pencari yang menilainya.

**Rumus URL Storage disatukan ke `src/lib/storage-url.ts` (2026-08-05):** sebelumnya ditulis ulang
di **empat** tempat (`post-doc.tsx`, `blog.ts`, `covers.ts`, `article-image-node.tsx`), ditambah
**delapan** literal `"post-covers"` di `artikel/actions.ts` dan **dua** salinan aturan "sudah URL →
bukan objek Storage" di jalur hapus. Bucket ini dipakai cover **dan** gambar isi (awalan `isi/`),
jadi bucket atau host yang berpindah dengan satu pemanggil terlewat menghasilkan gambar rusak di
satu permukaan saja — **tanpa error apa pun**. Keempatnya ternyata **tidak identik**, dan dua
perbedaannya disengaja sehingga ditulis sebagai komentar, bukan dihapus: (1) `blog.ts` memakai
`SUPABASE_URL` dari `env.ts` yang **melempar** bila kosong, sementara sisi yang ikut ke peramban
memakai `?? ""` yang diam — lemparan di peramban terjadi saat render dan mematikan seluruh editor,
padahal akibat sebenarnya cuma gambar tidak tampil; (2) `coverUrl()` menerima dan mengembalikan
`null` karena `cover_path` memang nullable. Satu perbedaan **tidak** disengaja dan diperbaiki:
guard `coverUrl()` tidak mengenal `blob:` — memperluas guard, tidak mengubah perilaku nyata karena
`blob:` tidak pernah tersimpan sebagai `cover_path`. `coverPublicUrl()` di `covers.ts` **dihapus**:
nol pemanggil di seluruh repo, dan isinya salinan kelima tanpa guard sama sekali. Terverifikasi
28/28 lewat `npm run uji:storage-url`, yang membandingkan helper baru terhadap salinan verbatim
keempat implementasi lama untuk masukan yang sama; bundel `/[locale]/blog/[slug]` tetap 124 kB.

**Alasan penolakan cover dibuang di jalur artikel baru (ditemukan 2026-08-05, sudah diperbaiki):**
`unggahCover()` sudah mengembalikan kalimat spesifik ("Berkas lebih dari 5 MB", "Lebar gambar
minimal 600 piksel", dan seterusnya), dan jalur **sunting** meneruskannya apa adanya. Jalur
**artikel baru** tidak: ia hanya menyalakan boolean `coverGagal` dan membuang `unggah.message`,
lalu menampilkan *"Cover gagal diunggah, jadi artikelnya belum bisa terbit. Coba pilih gambarnya
lagi."* — menyuruh mengulangi persis tindakan yang baru saja gagal, tanpa menyebut apa yang salah.
Sebabnya sudah dihitung satu baris di atasnya. Sekarang alasannya disimpan (`coverGagalPesan`),
ikut ke pesan galat **dan** ke `fields.cover` sehingga muncul tepat di bawah kolom covernya; jalur
draft membawanya lewat query `?cover=gagal&alasan=…` karena setelah `redirect()` tidak ada tempat
lain menitipkan kalimatnya. **Pelajarannya sama dengan bug terbit sebelumnya: dua jalur simpan
yang menangani hal yang sama secara berbeda akan menyimpang, dan yang menyimpang diam-diam adalah
yang jarang dilewati.**
Pesannya sekaligus dinaikkan dari kategori jadi angka — `CoverError` kini membawa `detail`
(`bytes`/`width`/`format`), sehingga layar berkata "Berkas ini 8,3 MB, melebihi batas 5,0 MB" dan
"Lebar gambar ini 420 piksel, sedangkan minimalnya 600 piksel". Batas yang tidak disebut angkanya
praktis tidak bisa dipatuhi. Terverifikasi 5/5 lewat `npm run uji:cover` — skrip itu **disimpan di
`scripts/`, tidak dihapus setelah dijalankan**, justru karena #43 mencatat bahwa uji-uji sebelumnya
hilang begitu selesai. Butuh `--conditions=react-server` sebab `covers.ts` mengimpor `server-only`.

**`next dev` dengan webpack menjadikan setiap 404 sebagai 500 (ditemukan 2026-08-05, sudah
diperbaiki):** dev server melempar *"not-found.tsx doesn't have a root layout"* dan menjawab
**HTTP 500** untuk URL 404 apa pun. Penyebabnya struktural dan disengaja: project ini **tidak
punya `src/app/layout.tsx`** — `<html>`/`<body>` dipegang `[locale]/layout.tsx` dan
`admin/layout.tsx` masing-masing, sebagaimana didokumentasikan di kepala `not-found.tsx` dan
`admin/layout.tsx`. Webpack dev menuntut root layout untuk `app/not-found.tsx`; **Turbopack
tidak**. Skrip `dev` karena itu jadi `next dev --turbopack`. **Produksi tidak pernah terpengaruh**
— diverifikasi pada build nyata: `/halaman-tidak-ada`, `/id/blog/tidak-ada`, dan `/id/apa-pun`
ketiganya menjawab `404`, jadi klaim status 404 di #11 dan #46 tetap berdiri.
**Yang membuat ini mahal bukan errornya, tapi penyamarannya:** overlay Next menampilkannya sebagai
*Build Error* pada layar apa pun yang kebetulan sedang dibuka — pemilik menemuinya saat menyisipkan
gambar di editor artikel — sehingga 404 asli yang memicunya tidak pernah terlihat. Kalau kelak ada
yang tergoda "memperbaikinya" dengan menambahkan `src/app/layout.tsx`: itu memaksa `<html>` bersarang
di dalam `<html>`, dan menyatukannya menuntut root layout membaca locale dari header — yang membuat
seluruh rute dinamis dan **mematikan SSG**. Jangan.

**Jendela ISR setelah ganti slug:** URL lama sempat menyajikan 200 basi, lalu 404 sesaat, sebelum
mantap jadi 308 — sekitar 50 detik pada pengukuran 2026-07-27. Harga ISR, bukan kegagalan. Jangan
panik dan jangan menambahkan `no-store` untuk "memperbaikinya".

**`response_format: json_object` sengaja tidak dikirim ke OpenRouter.** Dukungannya berbeda-beda
antar model, dan model yang tidak mendukungnya **menolak seluruh permintaan** — termasuk model
gratis yang jadi bawaan project ini. Format keluaran diminta lewat prompt dan diurai defensif
(pagar kode dan basa-basi pembuka ditoleransi; isinya tidak). Kalau kelak pindah ke model yang
menjaminnya, kirim parameter itu — jangan menghapus penguraian defensifnya.

**Draft terjemahan hanya untuk artikel berstatus draf.** Membuat draft menyetel
`translation_status` ke `generated`, dan `posts_publish_requires_reviewed_bilingual` menolak
artikel published dalam keadaan itu — pernyataannya akan gagal di tengah jalan. Action menolaknya
lebih dulu dengan pesan yang menjelaskan urutan yang benar: tarik dari publik, terjemahkan, tinjau,
terbitkan lagi.

**Teks Salsabilah masuk ke prompt, jadi permukaan prompt-injection nyata.** Artikel diapit penanda
`ARTIKEL_MULAI`/`ARTIKEL_SELESAI` dan prompt sistem menyatakan apa pun di dalamnya adalah bahan
terjemahan, bukan perintah. Itu mitigasi, bukan jaminan — yang benar-benar menahan dampaknya adalah
lapisan sesudahnya: keluaran model tidak pernah menentukan otorisasi, tidak pernah dirender sebagai
HTML, dan tidak pernah bisa menaikkan `translation_status` ke `reviewed`.

**Nilai contoh yang tayang jadi nilai sungguhan (ditemukan 2026-07-28, sudah diperbaiki):**
`src/components/contact.tsx` memuat `const FORMSPREE_ACTION = "https://formspree.io/f/REPLACE_ME"`
dan itu ikut tayang di produksi sejak one-pager pertama naik. Endpoint-nya menjawab **404**.
Formulir HTML biasa tidak bisa mengabarkan kegagalan: peramban mem-POST lalu berpindah halaman,
jadi pengunjung mendarat di halaman galat Formspree dan pesannya lenyap. Nol galat di log situs
ini, nol keluhan yang bisa sampai — orang yang gagal menghubungi tidak punya cara kedua untuk
memberi tahu bahwa cara pertama rusak. **Berapa pesan yang hilang tidak bisa diketahui, dan itu
bagian terburuknya.** Sekarang ID dibaca dari `NEXT_PUBLIC_FORMSPREE_ID`; kosong berarti
formulirnya tidak dirender, bukan dirender ke tempat yang tidak ada. Nilai `REPLACE_ME` juga
ikut dianggap kosong, supaya menyalinnya ke env var tidak menghidupkan ulang bug yang sama.
**Pelajaran yang lebih luas: placeholder aman di file konfigurasi yang wajib diisi, dan
berbahaya di dalam kode yang bisa ter-deploy apa adanya. Untuk integrasi pihak ketiga
berikutnya — baca dari env, dan bila kosong jangan render jalurnya.** Bandingkan dengan
konfigurasi terjemahan, yang sejak awal memang begitu; formulir kontaknya yang tertinggal.

**Token penalaran ikut memakan `max_tokens`, dan hasil terpotong bisa lolos validasi
(ditemukan 2026-07-28 pada panggilan sungguhan pertama ke provider, sudah diperbaiki):**
model bawaan `inclusionai/ling-3.0-flash:free` adalah model penalaran. Bagian "berpikir"-nya
dihitung ke dalam anggaran `max_tokens` yang sama dengan jawabannya — terukur **173 dari 201
token keluaran** habis untuk penalaran hanya untuk menerjemahkan satu kalimat enam kata. Saat
anggaran habis di tengah, respons datang dengan `finish_reason: "length"`. Dua akibatnya:
`content` bisa `null` (sudah tertangkap pemeriksaan lama), **atau berisi teks yang terpotong di
tengah kalimat — dan yang ini tidak tertangkap apa pun.** `validateShape()` hanya memeriksa
"tidak kosong" dan "tidak melebihi batas", jadi artikel yang separuh diterjemahkan akan
tersimpan sebagai draft yang tampak sah, tanpa satu pun penanda bahwa ada bagian yang hilang —
tepat jenis kegagalan yang paling mahal, karena yang meninjaunya tidak diberi alasan untuk
curiga. Sekarang `finish_reason: "length"` ditolak seluruhnya sebelum isinya dipakai.
**Panjang penalarannya juga tidak stabil:** pada teks dan model yang sama, anggaran 240 token
berhasil sementara 280 dan 320 gagal terpotong. Karena itu ia tetap diklasifikasi `sementara`
(retry punya peluang nyata lolos), bukan `permanen` seperti dugaan pertama — dan
`TRANSLATION_MAX_OUTPUT_TOKENS` dinaikkan 8000 → 16.000, karena 8000 pasti memotong artikel
panjang. **Jangan menyetel angka itu mepet ke panjang keluaran yang diharapkan.**

**Rahasia sungguhan hampir masuk ke `.env.example` (2026-07-28, tertangkap sebelum ter-commit):**
`OPENROUTER_API_KEY` dan `NEXT_PUBLIC_FORMSPREE_ID` sempat diisi nilai asli di **`.env.example`** —
file yang justru sengaja ikut ter-commit. Diperiksa dengan `git log --all -S "sk-or-v1-"`: belum
pernah masuk history, jadi kunci itu tidak perlu dicabut karena alasan ini. Dua sebab kekeliruannya
layak dicatat: nama file itu memang mengundang salah paham, dan **`.env.example` tidak dibaca
Next.js sama sekali** — jadi mengisinya terasa seperti mengonfigurasi padahal tidak mengubah
apa pun, baik lokal maupun produksi. Sekarang baris kuncinya membawa peringatan eksplisit bahwa
file itu ter-commit. Nilai asli hanya di `.env.local` (diabaikan git) dan di Vercel.

**Jangan menambahkan `tag_handling` ke permintaan DeepL (2026-07-28, sudah dibatalkan).**
Membungkus istilah glosarium dalam tag dan mendaftarkannya di `ignore_tags` terlihat lebih
kuat daripada memeriksa hasil — pelanggaran jadi mustahil, bukan sekadar terdeteksi. Panggilan
sungguhan membantahnya: tag itu dibaca DeepL sebagai penanda struktur, sehingga kalimat
dipotong di setiap batas tag (26 baris → 62 baris, blok daftar pecah), spasi di sekitarnya
dilahap, dan perlindungannya tetap bocor. Teks polos justru mempertahankan seluruh istilah.
**Yang membuat jebakan ini mahal: `missingTerms()` tetap LULUS** — istilahnya memang utuh,
yang hancur kalimat di sebelahnya. Tidak ada satu pun penjaga yang berbunyi, dan uji dengan
respons tiruan 20/20 juga lulus semua. Hanya membandingkan struktur render sisi ID dengan
sisi EN yang memperlihatkannya.

**Uji dengan respons tiruan tidak bisa menemukan cacat perilaku provider (2026-07-28).**
Dua bug paling merusak di fitur terjemahan — `billed_characters` yang hilang dan kerusakan
`tag_handling` — sama-sama lolos dari 20/20 uji fungsi murni, karena respons tiruannya dibuat
menurut *dugaan* tentang perilaku DeepL. Uji fungsi murni tetap berguna untuk logika sendiri;
ia hanya tidak boleh dianggap membuktikan apa pun tentang pihak ketiga. **Sebelum menyatakan
integrasi apa pun selesai, satu panggilan sungguhan dengan data nyata wajib dilakukan.**

**Perlindungan glosarium hanya sekuat isi glosariumnya (2026-07-28).** `missingTerms()` cuma
memeriksa istilah yang **terdaftar**. Glosarium awal seluruhnya istilah ekonometrika — RCA,
ARDL, gravity model — sedangkan artikel nyata pertama yang ditulis Salsabilah adalah catatan
lapangan tentang lebah kelulut, penuh nama takson. Kalau artikel itu diterjemahkan sebelum
migrasi `0009`, nama spesies bisa berubah dan penjaganya diam. **Pemicunya bukan "sesekali
tinjau glosarium" melainkan konkret: setiap artikel pertama di bidang baru menuntut
istilahnya dimasukkan lebih dulu.**

**Format artikel ketemu artikel nyata pertama, dan kalah (2026-07-28).** `PostBody` sengaja
cuma mendukung paragraf, `## `, dan `*miring*`. Artikel pertama Salsabilah memuat tabel
perbandingan 3 kolom, dua daftar berpoin, dan enam gambar — tiga hal yang tidak ada. Keputusan
pemilik: **tambah daftar saja**, tabel diubah jadi prosa, gambar ekstra dibuang. Dicatat di
sini karena godaan sebaliknya akan datang lagi: menambah renderer penuh markdown menuntut
sanitizer-nya sendiri, dan itu persis risiko yang sengaja dihindari untuk situs ber-`+public-ugc`.

**`defaultValue` tidak bisa diisi program (2026-07-29, sudah diperbaiki).** Empat kolom sisi
terjemahan memakai `defaultValue`, yang hanya dibaca sekali saat komponen lahir. Begitu
Preview mulai mengisi sisi itu lewat DeepL, hasilnya **tidak akan pernah terlihat** — tanpa
galat, tanpa peringatan React, cuma kolom yang tetap kosong. Keempatnya jadi terkendali.
Aturan umumnya: kolom yang isinya bisa datang dari mana pun selain ketikan orang tidak boleh
tak terkendali.

**Editor kaya hanya membaca isinya saat lahir (2026-07-29).** `RichEditor` menerima
`initialDoc`, dan mengubah prop itu tidak mengubah isi editor. Dokumen hasil terjemahan
dipasang dengan **memasang ulang** editornya lewat `key` yang berubah. Dipilih daripada
mengekspos `editor.commands.setContent` ke luar: penghitung `key` tidak bisa dipanggil pada
waktu yang salah, sedangkan perintah editor bisa — dan menimpa isi editor di tengah
pengetikan adalah kehilangan tulisan.

**Pemakaian yang tidak tercatat = plafon yang bisa dilewati (2026-07-29).** Terjemahan dari
layar artikel baru terjadi sebelum artikelnya punya baris, jadi `translation_runs.post_id`
harus `null` — bukan alasan untuk melewatkan pencatatannya. Kalau baris itu tidak ditulis,
`translation_characters_this_month()` menjumlahkan lebih sedikit dari yang benar-benar
dipakai, dan plafon bulanan bisa dilewati hanya dengan menerjemahkan berulang di layar itu.
**Setiap jalur berbayar wajib mencatat pemakaiannya, termasuk jalur yang belum punya induk.**

**Dua jalur untuk satu pekerjaan pasti menyimpang (2026-07-29).** Sempat ada dua cara membuat
terjemahan: tombol panel (menulis langsung ke database) dan tombol Preview (mengisi
formulir). Keduanya "bekerja", tapi hasil yang tersimpan bisa berbeda dari yang terlihat di
layar tergantung tombol mana yang ditekan — dan tidak ada galat yang memberi tahu. Jalur lama
dihapus, bukan dibiarkan sebagai alternatif. Sama seperti `uploadCover` sebelumnya: Server
Action yang tidak dipakai tetap endpoint POST yang bisa dijangkau.

**Dari `+ai`:** output model diperlakukan sebagai input tak tepercaya · output model tidak pernah
menentukan otorisasi · retry dibatasi agar loop gagal tidak jadi tagihan · glosarium istilah
teknis diverifikasi terhadap output, bukan sekadar dipercaya ada di prompt.

## Temuan linter Supabase yang sengaja dibiarkan

`authenticated_security_definer_function_executable` pada `public.is_admin()` — dibiarkan
**dengan sengaja**. RLS mengevaluasi ekspresi policy memakai hak peran yang bertanya, sehingga
`authenticated` wajib punya EXECUTE atau seluruh policy admin ikut mati. Fungsinya hanya
mengembalikan boolean tentang pemanggil sendiri dan tidak membocorkan data siapa pun. Hak
eksekusi untuk `anon` sudah dicabut di migrasi `0002`.

`anon_security_definer_function_executable` dan `authenticated_security_definer_function_executable`
pada `public.consume_rate_limit()` — dibiarkan **dengan sengaja**, alasannya sekelas di atas.
`anon` wajib punya EXECUTE karena pembatas laju login harus berjalan sebelum ada sesi; kalau
dicabut, jalur brute-force login kehilangan pembatasnya. Fungsinya hanya mengembalikan satu boolean
tentang kunci yang pemanggilnya sendiri kirim dan tidak pernah membocorkan baris siapa pun.

`anon_security_definer_function_executable` dan pasangan `authenticated`-nya pada `post_comment()`,
`toggle_like()`, dan `has_liked()` — dibiarkan **dengan sengaja, karena itulah seluruh rancangannya**
(migrasi 0006). Ketiganya memang harus bisa dipanggil pembaca anonim; yang menjaga batasannya ada di
dalam fungsi itu sendiri, bukan di grant. Justru sebaliknya yang berbahaya: mencabut EXECUTE di sini
berarti mengembalikan jalur INSERT langsung yang baru saja ditutup.

`rls_enabled_no_policy` pada `public.likes` (INFO) — sama seperti `rate_limits`. Hak baca tabel
`likes` sengaja dicabut dari `anon` karena membacanya berarti bisa mendaftar penanda pengunjung
lain; jumlah like sudah tersimpan di `posts.like_count`, dan keadaan tombol dibaca lewat
`has_liked()`.

`rls_enabled_no_policy` pada `public.rate_limits` (INFO) — memang begitu rancangannya. RLS aktif
tanpa satu pun policy berarti tabelnya tertutup rapat lewat REST; satu-satunya jalan masuk adalah
fungsi `security definer` di atas. Terverifikasi: kunci anon membaca tabel itu mengembalikan `[]`.

`auth_leaked_password_protection` — **tidak bisa ditutup pada paket saat ini.** Pemeriksaan
HaveIBeenPwned milik Supabase Auth hanya tersedia mulai paket Pro, sedangkan project ini di paket
gratis (postur $0/bulan). Bukan gate yang gagal; `deferred` dengan pemicu buka ulang: bila project
naik ke Pro.

## Yang belum diverifikasi lewat UI (per 2026-07-29)

**Basis datanya sekarang benar-benar kosong (0 baris `posts`), dan itu justru momen terbaik untuk
menjalankan daftar ini.** Tidak ada konten asli yang bisa rusak, dan artikel pertama yang ditulis
Salsabilah sebaiknya bukan kelinci percobaan bagi tujuh alur dasbor yang belum pernah diklik.
Urutan yang menutup paling banyak sekaligus: buat draf → unggah cover → coba terbitkan
(memicu penolakan `23514` karena terjemahan belum ditinjau) → isi sisi kedua → tandai ditinjau →
terbitkan → ganti slug → tarik → arsipkan → pulihkan → hapus permanen.

**Checklist langkah-demi-langkahnya ada di [`UJI-DASBOR.md`](./UJI-DASBOR.md)**, lengkap dengan
hasil yang diharapkan tiap langkah dan label tombol yang dikutip dari `admin-copy.ts`. Daftar ini
tidak bisa dijalankan tanpa sesi admin, jadi pemegang kredensial yang harus mengerjakannya.

Sebagian besar bukti di atas dihasilkan lewat pemanggilan langsung ke database, HTTP terhadap
server produksi lokal, dan pengujian fungsi murni — bukan dengan mengklik dasbor. Yang berikut ini
**belum pernah dijalankan sekali pun lewat antarmuka**, dan harus dicoba sebelum rilis:

- Menyimpan artikel baru lewat tombol **Simpan draf** (jalur `saveArticle` untuk baris baru).
- Unggah cover. Pipeline-nya sudah diuji terpisah 12/12, tapi jalur
  `File → Server Action → Storage → kolom cover_path` belum. **Berubah 2026-07-29:** cover kini
  ikut pengiriman formulir dan bisa dipilih sebelum artikel pernah disimpan, jadi yang diuji
  bukan lagi panel terpisah.
- **Editor kaya** — seluruh toolbar. Daftar putih dan renderer-nya sudah diuji 22/22 lewat
  pemanggilan langsung, tapi belum satu tombol pun ditekan di layar sungguhan.
- **Sisipkan gambar di tengah isi**, beserta pembersihan gambar yatim saat gambar dihapus dari
  isi lalu artikelnya disimpan.
- **Tabel**: sisip, tambah baris, tambah kolom, hapus.
- **Tandai terjemahan sudah ditinjau**, **Tarik dari publik**, **Arsipkan**, **Pulihkan**,
  **Hapus permanen**.
- Penolakan `23514` yang muncul di layar saat menerbitkan artikel yang syaratnya belum lengkap.
  Constraint-nya sudah terbukti menolak di tingkat database; yang belum adalah pemetaannya jadi
  kalimat Indonesia di dasbor.
- Ganti slug lewat formulir (mekanisme `rename_post_slug` sendiri sudah terbukti).
- Halaman moderasi `/admin/komentar`: tab, hapus, dan pulihkan. Hasil hapus lunaknya sudah
  terbukti lewat database, tapi tombolnya belum pernah ditekan.

Sisi pembaca sudah diuji lewat antarmuka sungguhan pada 2026-07-28: mengirim komentar lewat
formulir (muncul seketika di puncak daftar), menekan tombol suka (hitungan naik, `aria-pressed`
berubah), honeypot terpasang di luar layar dengan `tabindex="-1"` dan `aria-hidden`, serta
teks komentar terbukti **tidak ikut** di HTML yang dirender server.

- **Tombol Preview yang menerjemahkan.** Mesinnya (`translateArticle`) sudah terbukti lewat dua
  panggilan DeepL sungguhan, termasuk batching 61 teks jadi 2 batch dengan struktur keluar
  identik. Yang belum: `translateFormContent` itu sendiri, karena ia **tidak bisa dijalankan di
  luar Next** — `actions.ts` mengimpor `next/navigation`, yang menarik konteks App Router dan
  gagal dengan `TypeError: _react.default.createContext is not a function`. Jadi pemilihan kolom
  sumber, aturan "tidak menimpa", dan tombol Terjemahkan ulang hanya terjamin oleh tipe dan
  build. **Diuji di lokal, bukan produksi** — `DEEPL_API_KEY` baru ada di `.env.local`.

## Tindakan manual

### Sudah selesai

1. ~~**Matikan signup publik**~~ — **selesai, diverifikasi 2026-07-28.** Bukannya membaca
   layar dasbor Supabase, ini diuji terhadap GoTrue produksi: `POST /auth/v1/signup` dengan
   kunci publishable menjawab `422 {"error_code":"signup_disabled"}`. Tidak ada akun yang
   terbuat, dan buktinya datang dari jalur yang benar-benar dipakai penyerang. Cara mengulang
   pemeriksaan ini kapan pun (aman, tidak menulis apa pun bila signup memang mati):
   ```bash
   curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/signup" -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -H "Content-Type: application/json" -d '{"email":"probe@example.com","password":"probe-not-a-real-account-8821"}'
   ```
2. ~~**Hapus tiga artikel `[DUMMY]`**~~ — **selesai** lewat commit `d1b5291`, dan lebih
   menyeluruh daripada yang diminta: `select * from posts` mengembalikan **0 baris**, dan
   direktori `public/blog-covers/` sudah tidak ada. K8 tertutup.

### Masih menunggu pemilik

**Semuanya bermuara pada satu tempat: Vercel → Settings → Environment Variables.** Nilai-nilai
ini pernah diisi ke `.env.example` pada 2026-07-28, dan itu tidak mengonfigurasi apa pun —
`.env.example` tidak dibaca Next.js, hanya jadi contoh yang ikut ter-commit. `.env.local` sudah
dibetulkan sehingga pengembangan lokal jalan; **produksi masih kosong, dan itu terbukti dari
luar** (lihat #29). Setelah mengisi di Vercel, wajib **Redeploy** — env var baru tidak masuk ke
deployment yang sudah jadi, dan `NEXT_PUBLIC_*` khususnya dipanggang saat build.

1. **`DEEPL_API_KEY`** — satu-satunya yang wajib, dan satu-satunya gate blocking yang masih
   terbuka (#29). Kuncinya sudah **terbukti bekerja** lewat panggilan sungguhan (lihat #34),
   jadi yang tersisa benar-benar hanya menyalin nilainya dari `.env.local` ke Vercel.
   Host-nya diturunkan sendiri dari akhiran `:fx`, jadi tidak ada env var lain yang perlu
   diisi. Sebelum ini terpasang, tombol **Preview** di produksi menjawab *"Terjemahan
   otomatis belum dikonfigurasi"* — fiturnya benar, hanya belum punya kunci.
   *(Menggantikan `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` yang tercatat di sini sebelum
   provider berpindah 2026-07-28.)*
2. **`NEXT_PUBLIC_FORMSPREE_ID`** — isi `meeynobq` (ID-nya saja, **bukan** URL lengkapnya).
   Endpoint itu sudah diverifikasi hidup. Dikosongkan **bukan** keadaan rusak: bagian kontak
   menampilkan tombol Kirim email, dan itulah yang tayang di produksi sekarang. Sebelum
   mengisinya, lihat catatan privasi di #6 — sejak formulir aktif, nama/email/isi pesan
   pengunjung mengalir ke pihak ketiga, dan catatan privasi situs belum menyebut itu.
3. **`RATE_LIMIT_SALT`** — opsional, tapi selama kosong hash IP pada `rate_limits` menyamarkan
   tanpa menganonimkan. Isi teks acak panjang.

### Tidak wajib, tapi disarankan

Kunci OpenRouter sempat ditulis ke `.env.example` sebelum diselamatkan. Ia **tidak pernah masuk
git history** (diperiksa `git log --all -S`), jadi tidak ada kebocoran yang perlu ditangani.
Kalau ingin bersih sepenuhnya, mencabut dan membuat kunci baru di
https://openrouter.ai/keys memakan waktu satu menit dan menghapus keraguan.

Tidak ada lagi artikel uji yang tertinggal: `catatan-uji-301` (sisa pengujian 301 pada
2026-07-27) ikut terhapus. Konsekuensinya **Pulihkan** dan **Hapus permanen** kini tidak punya
bahan uji — keduanya masih belum pernah diklik, dan mencobanya berarti membuat artikel baru
dulu lalu mengarsipkannya.

## Checkpoint

- **Sebelum skema difinalkan:** #16, #12, #19.
- **Sebelum route handler publik pertama:** #18, #26, #27, #28.
- **Sebelum panggilan LLM pertama dari produksi:** #34, #5, #29, #46.
- **Sebelum deploy pertama:** #11, #38, #13, #27, #30, #35.
- **Sebelum Fase 2 (UGC) dirilis:** #6, #19, #22, #50.
- **Sebelum struktur URL diubah kapan pun:** petakan redirect lebih dulu.
