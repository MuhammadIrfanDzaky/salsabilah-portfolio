# Project Scope & Competency Ledger

- **Category:** `content` `+public-ugc` `+ai`
- **Classified:** 2026-07-09 (re-klasifikasi; sebelumnya `portfolio`, lalu `content`)
- **Last audit:** 2026-07-09
- **Gates open:** 14 dari 21 blocking
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
| K5 | Dibangun **bertahap**. Fase 1: fondasi + tulis/terjemah/terbit + grid + pencarian + cover. Fase 2: like, comment, share |
| K6 | Kategori awal: 3 — ringkasan awam publikasi, analisis komoditas & kebijakan, catatan lapangan/konferensi |
| K7 | Entri nav & rute blog **disembunyikan** sampai ada minimal 1 artikel berstatus published |
| K8 | Konten awal memakai dummy data; Salsabilah mengganti setelah dashboard siap. **3 artikel dummy sudah masuk**, judulnya diawali `[DUMMY]` dan cover-nya berupa placeholder di `public/blog-covers/` — semuanya harus dihapus sebelum rilis |

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
| 2 | Documentation & Maintenance | deferred | README masih bawaan `create-next-app`. **Reopen: sebelum rilis** — wajib memuat panduan pakai dashboard berbahasa Indonesia untuk Salsabilah |
| 5 | Cost & FinOps | deferred | Naik ke blocking karena `+ai`. Belum ada plafon biaya maupun alert. **Reopen: sebelum panggilan LLM pertama dari produksi** |
| 6 | Legal & Compliance | deferred | Naik ke blocking karena `+public-ugc`. Butuh aturan berkomentar, jalur pelaporan, proses takedown, dan catatan privasi (form kontak + analytics + IP komentar). **Reopen: Fase 2** |
| 11 | SEO & Metadata | applied | Metadata per-locale + OG/Twitter + canonical + `hreflang`, OG image dinamis, `src/app/sitemap.ts` (10 URL dengan 20 alternate hreflang; indeks blog hanya masuk bila ada artikel terbit), `src/app/robots.ts` (menutup `/admin` dan `/api/`, menunjuk sitemap), structured data `BlogPosting` per artikel, dan RSS per bahasa di `/[locale]/feed.xml` — terbukti terparsing sebagai XML valid dengan `Content-Type: application/rss+xml` |
| 12 | i18n / Timezone / Locale | deferred | Rute `/en` `/id` terbukti jalan. Tapi jadwal terbit membuat timezone jadi nyata: `published_at` disimpan UTC, ditulis/ditampilkan WIB. **Reopen: bersama skema tabel `posts`** |
| 13 | Performance | applied | Diukur pada **deploy nyata** `https://salsabilah.vercel.app` (2026-07-26): `/en` Performance 94 · Accessibility 100 · Best Practices 100 · SEO 100; `/id` 96 pada run bersih. LCP stabil 2,5–2,8s, CLS 0. **Catatan:** skor sempat 66–83 pada beberapa run — penyebabnya TBT yang melonjak mengikuti beban CPU mesin pengukur, bukan situs (LCP tidak berubah). **Reopen: setelah halaman blog benar-benar terbit, karena rute berbasis database belum ikut terukur** |
| 16 | Data Modeling | applied | `supabase/migrations/0001_init_blog.sql` diterapkan ke project. Constraint dideklarasikan di database, bukan hanya di aplikasi: gate terbit bilingual+reviewed, FK dengan `on delete restrict/cascade`, unique pada slug, PK gabungan pada `likes` untuk idempotensi, indeks pada semua kolom filter, dan `post_slug_history` untuk redirect 301. Terverifikasi via `list_tables`: 7 tabel, RLS aktif semua |
| 18 | Data Validation | deferred | Blocking ganda (`+public-ugc` dan `+ai`): input komentar divalidasi server-side per tipe/panjang/konten, **dan** output model divalidasi terhadap skema sebelum dipakai. **Reopen: bersama route handler pertama** |
| 19 | Data Lifecycle | deferred | Soft delete untuk komentar + riwayat moderasi; artikel di-unpublish, bukan dihapus. **Reopen: bersama skema** |
| 21 | Search | applied | Full-text search Postgres via kolom tsvector `search_id`/`search_en` dengan indeks GIN, mode `websearch` — bukan `LIKE '%x%'`. Form GET biasa sehingga tetap jalan tanpa JavaScript dan hasilnya berupa URL yang bisa dibagikan. Terverifikasi: `q=cengkeh`→1, `q=clove`→1, `q=zzzznonsense`→0, dan irisan filter+cari benar (`kategori=analisis&q=cengkeh`→1, `kategori=catatan&q=cengkeh`→0) |
| 22 | File & Media | applied | Bucket `post-covers`: batas 5MB, MIME dibatasi ke jpeg/png/webp/avif (**SVG sengaja dilarang** — bisa memuat script), disajikan dari `<ref>.supabase.co` yakni origin terpisah dari aplikasi. `src/lib/covers.ts` melakukan cek **berbasis isi** (harus benar-benar terdekode sebagai raster), auto-rotate lalu re-encode ke webp yang sekaligus membuang EXIF/GPS, dengan `limitInputPixels` sebagai penangkal decompression bomb. Terverifikasi 5/5: gambar asli lolos, EXIF terbukti hilang, teks menyamar ditolak, SVG ditolak, anon ditolak saat unggah. Anon juga tidak bisa mendaftar isi bucket (migrasi `0004`). **Sisa yang diverifikasi di langkah 3:** jalur unggah admin yang berhasil |
| 25 | Authentication | deferred | Dashboard admin butuh login. Pengguna tunggal (Salsabilah). **Reopen: sebelum route admin pertama dibuat** |
| 26 | Permissions & Access Control | deferred | Otorisasi dicek server-side pada setiap mutasi, bukan hanya disembunyikan di UI. RLS Supabase sebagai lapis kedua. Model tidak boleh menentukan keputusan otorisasi. **Reopen: bersama auth** |
| 27 | Security & SSL | deferred | Output escaping terhadap stored XSS; konten pembaca tidak pernah dirender sebagai HTML mentah; permukaan prompt-injection ditinjau karena teks Salsabilah masuk ke prompt. Security headers belum diset. **Reopen: sebelum deploy** |
| 28 | Rate Limiting | deferred | Blocking ganda: pembatas abuse untuk komentar/like **dan** pembatas biaya untuk endpoint terjemahan. **Reopen: bersama endpoint publik pertama** |
| 29 | Env & Secrets | deferred | `.env.example` sudah ada dan ikut repo (pengecualian `!.env.example` ditambahkan ke `.gitignore`, karena pola `.env*` tadinya ikut mengabaikannya). `.env.local` terbukti diabaikan git. `src/lib/supabase/env.ts` menggagalkan startup bila variabel hilang. Service key Supabase **sengaja tidak pernah diambil** — aplikasi memakai kunci publishable + RLS saja. **Sisa: `ANTHROPIC_API_KEY` belum diisi dan secret produksi belum ditaruh di managed store. Reopen: langkah 4 dan saat deploy** |
| 34 | AI / LLM Integration | deferred | Plafon biaya per request, batas token, model & versi dipin, output diperlakukan sebagai input tak tepercaya, fallback saat provider mati. **Reopen: Fase 1, saat fitur terjemahan dibuat** |
| 38 | Cache & CDN | applied | Terpasang di CDN Vercel sejak deploy 2026-07-26. One-pager tetap statis; rute blog dan sitemap memakai ISR `revalidate = 60`, dan cache data Supabase diselaraskan ke jendela yang sama (lihat catatan jebakan di bawah). Aset `_next/static` dilewati matcher middleware sehingga tidak menambah hop |
| 46 | Error Handling | deferred | Halaman 404 khusus sudah ada (`src/app/not-found.tsx`): sadar bahasa dari sisi server, status 404 benar, `noindex`, dan mandiri dari `globals.css`. **Sisa (tetap blocking karena `+ai`): `error.tsx` untuk kegagalan runtime, plus fallback saat provider terjemahan timeout/outage/menolak. Reopen: bersama fitur terjemahan** |
| 50 | Admin / Back-office | deferred | Inti dari K1. Wajib sebelum rilis: tulis/edit/draft/jadwal/terbit, unggah cover, tinjau terjemahan, serta hapus + pulihkan komentar. **Reopen: Fase 1** |

## Recommended

| # | Competency | Status | Evidence / reason |
|---|---|---|---|
| 1 | Requirements & Scoping | applied | Build spec awal + 13 kriteria sukses terverifikasi; K1–K8 di atas menutup scope blog |
| 7 | Frontend | applied | Komponen per-section di `src/components/`. **Catatan:** rute blog butuh loading/empty/error state yang belum ada |
| 9 | Application State | applied | `next-themes` + `useState` lokal; tanpa sumber kebenaran ganda |
| 10 | Accessibility | applied | Lighthouse Accessibility 100 di `/en` dan `/id`. **Reopen:** form dashboard & komentar harus ikut diuji |
| 14 | APIs & Backend Logic | deferred | Belum ada route handler. Butuh kontrak response/error yang konsisten. **Reopen: Fase 1** |
| 15 | Database & Storage | deferred | Koneksi jalan dan terbukti: `src/lib/supabase/{env,server,client}.ts`; 6/6 pemeriksaan RLS lulus dengan kunci publishable. Pooling ditangani Supabase. Indeks terpasang pada slug, status+published_at, category_id, dan dua indeks GIN untuk FTS. **Sisa: bucket Storage untuk cover image. Reopen: langkah 2** |
| 17 | Migrations | applied | Migrasi berversi di `supabase/migrations/` dan ikut ter-commit: `0001_init_blog.sql`, `0002_harden_functions.sql`. Isi file identik dengan yang diterapkan ke database |
| 23 | Queues & Async | deferred | Dibuka kembali oleh jadwal terbit (K1). Rencana: Vercel Cron, bukan queue penuh. **Reopen: Fase 1** |
| 30 | Dependency & Supply Chain | applied | `npm audit --omit=dev` → **0 kerentanan** (2026-07-09). Ditutup dengan `next@15.5.22` plus `overrides` di `package.json` yang memaksa `postcss@^8.5.23` dan `sharp@^0.35.3` — bump `next` saja ternyata tidak cukup karena advisory-nya menyasar dua dependensi bawaan itu. Lockfile ter-commit. **Catatan:** `overrides` harus ditinjau ulang setiap kali `next` di-upgrade, kalau-kalau sudah tidak diperlukan |
| 35 | Hosting & Deployment | applied | Live di `https://salsabilah.vercel.app` (project `prj_NFoCWbLv3XKCftBfKMONveSUFKkT`). Deploy otomatis tiap push ke `master`; build commit `5866677` selesai 50 detik. **Rollback:** Vercel → Deployments → pilih deployment lama bertanda *rollback candidate* → Promote to Production; deployment sebelumnya (`dpl_5cgx…`) masih tersedia sebagai titik balik |
| 42 | Code Quality Automation | deferred | ESLint + TypeScript jalan saat build, belum dipaksakan otomatis. **Reopen: bersama CI** |
| 43 | Automated Testing | deferred | Naik kepentingannya: penyaringan draft, fallback bahasa, dan otorisasi admin adalah logika yang layak diuji. **Reopen: Fase 1** |
| 44 | Logging & Monitoring | deferred | Belum ada uptime check maupun pelacakan 404. **Reopen: setelah deploy; wajib setelah perubahan struktur URL** |
| 48 | Backup & Recovery | deferred | Repo ter-push ke GitHub (`master` sinkron dengan origin), tapi **isi database belum tercakup**. Butuh backup DB + satu kali uji restore. **Reopen: setelah artikel asli pertama masuk** |
| 49 | Bus Factor & Continuity | deferred | Kredensial Supabase, API key, akses domain belum dicatat di tempat aman. **Reopen: saat deploy** |
| 51 | Product Analytics | applied | `<Analytics />` terpasang di root layout; script terverifikasi ada di DOM |
| 37 | CI/CD | deferred | Vercel build otomatis saat push; belum ada pipeline lint/test. **Reopen: bersama test** |
| 20 | Idempotency & Concurrency | deferred | Penulis tunggal. Tapi like butuh dedup agar tidak bisa diklik berulang. **Reopen: Fase 2** |

## Deferred by decision

| # | Competency | Reason | Reopen when |
|---|---|---|---|
| 3 | Architecture Decision Records | Project solo; keputusan besar tercatat di ledger ini | Ada kontributor kedua |
| 4 | Client & Stakeholder Management | Komunikasi langsung dengan pemilik situs | Ada tenggat pihak ketiga |
| 33 | Transactional Email | Tidak mengirim email atas nama domain sendiri; form kontak ditangani Formspree | Butuh notifikasi email (mis. pemberitahuan komentar baru) |
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

**Dari `+ai`:** output model diperlakukan sebagai input tak tepercaya · output model tidak pernah
menentukan otorisasi · retry dibatasi agar loop gagal tidak jadi tagihan · glosarium istilah
teknis diverifikasi terhadap output, bukan sekadar dipercaya ada di prompt.

## Temuan linter Supabase yang sengaja dibiarkan

`authenticated_security_definer_function_executable` pada `public.is_admin()` — dibiarkan
**dengan sengaja**. RLS mengevaluasi ekspresi policy memakai hak peran yang bertanya, sehingga
`authenticated` wajib punya EXECUTE atau seluruh policy admin ikut mati. Fungsinya hanya
mengembalikan boolean tentang pemanggil sendiri dan tidak membocorkan data siapa pun. Hak
eksekusi untuk `anon` sudah dicabut di migrasi `0002`.

## Checkpoint

- **Sebelum skema difinalkan:** #16, #12, #19.
- **Sebelum route handler publik pertama:** #18, #26, #27, #28.
- **Sebelum panggilan LLM pertama dari produksi:** #34, #5, #29, #46.
- **Sebelum deploy pertama:** #11, #38, #13, #27, #30, #35.
- **Sebelum Fase 2 (UGC) dirilis:** #6, #19, #22, #50.
- **Sebelum struktur URL diubah kapan pun:** petakan redirect lebih dulu.
