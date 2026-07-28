-- Pindah provider terjemahan: OpenRouter (LLM) → DeepL.
--
-- Yang berubah di sini hanya satuan akuntansinya. LLM menagih token keluaran;
-- DeepL menagih **karakter sumber** dan mengembalikan `billed_characters` per
-- respons. Menyimpan angka DeepL di kolom bernama `output_tokens` akan membuat
-- setiap pembacaan tabel ini salah tafsir selamanya, jadi kolomnya diganti,
-- bukan dipakai ulang diam-diam.
--
-- Aman dilakukan sebagai penggantian penuh: `translation_runs` masih 0 baris
-- (diperiksa sebelum migrasi ini ditulis) — tidak ada riwayat yang hilang.
-- Kalau kelak tabel ini sudah berisi, migrasi serupa wajib menambah kolom baru
-- dan menyimpan yang lama, bukan menjatuhkannya.
--
-- Plafon per-permintaan tidak lagi diperlukan dalam bentuk token: batas panjang
-- sumber 24.000 karakter yang sudah ada sejak awal justru **satuan yang sama**
-- dengan cara DeepL menagih, jadi penjagaan sebelum-biaya-keluar sekarang tepat
-- alih-alih perkiraan.

alter table translation_runs drop column input_tokens;
alter table translation_runs drop column output_tokens;

alter table translation_runs
  add column billed_characters integer not null default 0
    check (billed_characters >= 0);

comment on column translation_runs.billed_characters is
  'Karakter yang ditagihkan provider, dibaca dari respons (DeepL: billed_characters). Dasar plafon bulanan.';

-- `model` tetap dipakai, isinya kini `model_type_used` dari respons DeepL.
-- Namanya dipertahankan karena maknanya sama: varian mesin yang benar-benar
-- melayani permintaan ini, dibaca dari respons dan bukan dari konfigurasi.
comment on column translation_runs.model is
  'Varian mesin yang benar-benar melayani, dibaca dari respons (DeepL: model_type_used). Bukan salinan konfigurasi.';

/*
 * Pemakaian karakter bulan berjalan.
 *
 * Menggantikan translation_tokens_this_month(). Alasan dihitung di database
 * tidak berubah: satu pernyataan, tanpa jendela balapan antara membaca jumlah
 * dan memutuskan boleh-tidaknya memanggil provider.
 *
 * Pada paket DeepL Free kuotanya 1 juta karakter per bulan dan berhenti sendiri
 * di sisi provider (HTTP 456), jadi fungsi ini bukan pencegah tagihan — tidak
 * ada tagihan yang bisa keluar. Gunanya: berhenti **sebelum** kuota habis,
 * supaya kegagalan datang sebagai kalimat yang bisa dibaca Salsabilah, bukan
 * sebagai galat provider di tengah pekerjaan.
 */
drop function if exists translation_tokens_this_month();

create or replace function translation_characters_this_month()
  returns integer language sql stable security invoker set search_path = public as $$
    select coalesce(sum(billed_characters), 0)::integer
      from translation_runs
     where created_at >= date_trunc('month', now())
  $$;

revoke all on function translation_characters_this_month() from public, anon;
grant execute on function translation_characters_this_month() to authenticated;
