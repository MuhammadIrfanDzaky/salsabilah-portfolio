-- Isi artikel jadi dokumen terstruktur (editor ala Word).
--
-- Kolom `body_id`/`body_en` TIDAK dihapus, dan itu inti rancangannya: keduanya
-- kini **cermin teks polos** dari dokumen, bukan sumber kebenaran. Yang jadi
-- sumber adalah `doc_id`/`doc_en`.
--
-- Kenapa cermin itu dipertahankan, tiga alasan yang masing-masing berdiri
-- sendiri:
--
-- 1. **Pencarian.** `search_id`/`search_en` adalah kolom tsvector turunan dari
--    `body_*`. Kalau isinya diganti JSON, yang terindeks adalah nama kunci dan
--    tanda kurung — pencarian tetap "jalan" tapi hasilnya omong kosong, dan
--    kegagalan seperti itu tidak menimbulkan galat apa pun. Dengan cermin,
--    seluruh mesin pencarian yang sudah terbukti tidak perlu disentuh.
--
-- 2. **Gate terbit.** CHECK constraint `posts_publish_requires_reviewed_bilingual`
--    menuntut `body_*` terisi. Cermin membuat syarat itu tetap berlaku apa
--    adanya, tanpa menulis ulang constraint yang sudah teruji.
--
-- 3. **Jaring pengaman.** Kalau kelak dokumen JSON-nya gagal diurai karena
--    alasan apa pun, teks artikelnya masih ada dan terbaca manusia. Menyimpan
--    hanya JSON berarti satu bug parser bisa membuat tulisan tidak terbaca.
--
-- Konsekuensinya: setiap penulisan wajib memperbarui KEDUANYA. Menulis dokumen
-- tanpa memperbarui cermin akan membuat pencarian menemukan teks lama pada
-- artikel yang isinya sudah berubah — sinkronisasi itu dijaga di aplikasi
-- (`src/lib/doc.ts` + action simpan), bukan di sini.

alter table posts
  add column doc_id jsonb,
  add column doc_en jsonb;

comment on column posts.doc_id is
  'Dokumen isi bahasa Indonesia (format TipTap/ProseMirror). Sumber kebenaran; body_id adalah cermin teks polosnya.';
comment on column posts.doc_en is
  'Dokumen isi bahasa Inggris. Sumber kebenaran; body_en adalah cermin teks polosnya.';
comment on column posts.body_id is
  'Cermin teks polos dari doc_id. Dipakai pencarian full-text dan gate terbit — jangan disunting langsung.';
comment on column posts.body_en is
  'Cermin teks polos dari doc_en. Dipakai pencarian full-text dan gate terbit — jangan disunting langsung.';
