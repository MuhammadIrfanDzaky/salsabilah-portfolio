-- Langkah 4: catatan pemakaian terjemahan.
--
-- Competency 5 mensyaratkan plafon biaya dan alert sebelum panggilan LLM
-- pertama dari produksi. Plafon per-request bisa ditegakkan di kode lewat batas
-- token keluaran, tapi plafon *kumulatif* butuh ingatan: tanpa catatan, tidak
-- ada yang tahu sudah berapa banyak token terpakai bulan ini.
--
-- Tabel ini juga jadi jejak audit untuk #34: model dan provider yang benar-benar
-- melayani setiap permintaan tercatat per baris, bukan diasumsikan dari env.

create table translation_runs (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid references posts (id) on delete cascade,

  -- Arah terjemahan, bukan sekadar bahasa sumber: satu artikel bisa
  -- diterjemahkan dua arah sepanjang hidupnya.
  direction     text not null check (direction in ('id-en', 'en-id')),

  -- Dicatat apa adanya dari respons provider, bukan disalin dari konfigurasi.
  -- Kalau routing diam-diam berpindah model, baris inilah yang membuktikannya.
  provider      text not null,
  model         text not null,

  status        text not null check (status in (
                  'ok',
                  'gagal-provider',
                  'gagal-validasi',
                  'gagal-glosarium',
                  'terlalu-panjang',
                  'plafon-terlampaui'
                )),

  input_tokens  integer not null default 0 check (input_tokens  >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),

  -- Ringkasan kegagalan untuk dibaca manusia. Bukan pesan provider mentah:
  -- itu bisa memuat potongan prompt, dan prompt memuat tulisan Salsabilah.
  error_note    text,

  created_at    timestamptz not null default now()
);

comment on table translation_runs is
  'Satu baris per percobaan terjemahan, berhasil maupun gagal. Dasar plafon biaya bulanan (competency 5) dan jejak audit model (competency 34).';

-- Dipakai untuk menjumlahkan pemakaian bulan berjalan pada setiap permintaan,
-- jadi harus murah.
create index translation_runs_bulan_idx on translation_runs (created_at desc);
create index translation_runs_post_idx  on translation_runs (post_id, created_at desc);

alter table translation_runs enable row level security;

-- Hanya admin. Tidak ada policy untuk anon: pemakaian token bukan urusan
-- pembaca, dan jumlahnya bisa dipakai menakar volume kerja Salsabilah.
create policy translation_runs_admin_all on translation_runs
  for all to authenticated
  using (is_admin()) with check (is_admin());

/*
 * Pemakaian token keluaran bulan berjalan.
 *
 * Dihitung di database, bukan di aplikasi, karena inilah yang menegakkan
 * plafon: satu pernyataan, tanpa jendela balapan antara membaca jumlah dan
 * memutuskan boleh-tidaknya memanggil provider.
 *
 * security invoker — pemanggilnya selalu sesi admin, dan RLS di atas sudah
 * membatasi barisnya. Tidak ada alasan menaikkan hak di sini.
 */
create or replace function translation_tokens_this_month()
  returns integer language sql stable security invoker set search_path = public as $$
    select coalesce(sum(output_tokens), 0)::integer
      from translation_runs
     where created_at >= date_trunc('month', now())
  $$;

revoke all on function translation_tokens_this_month() from public, anon;
grant execute on function translation_tokens_this_month() to authenticated;
