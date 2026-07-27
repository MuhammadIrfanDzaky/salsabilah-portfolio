-- Persiapan dashboard admin (langkah 3): pembatas laju, perbaikan rename slug,
-- dan penanda terjemahan basi.
--
-- Tiga hal terpisah, semuanya prasyarat sebelum route admin pertama dibuat:
--   1. rate_limits + consume_rate_limit()  -> competency 28
--   2. rename_post_slug() bebas tabrakan   -> cacat nyata di 0001
--   3. trigger reset tinjauan terjemahan   -> K2, khusus draft
--   4. indeks untuk daftar artikel admin

-- ------------------------------------------------------------- 1. rate limit

-- Penghitung disimpan di Postgres, bukan di memori proses. Fungsi serverless
-- Vercel berumur pendek dan tidak berbagi memori antar instance, jadi Map
-- in-memory akan mereset sendiri setiap cold start — praktis tidak membatasi
-- apa pun. Redis melanggar postur $0/bulan; Supabase sudah ada dan gratis.
--
-- Jendela tetap (fixed window), bukan sliding: satu baris per (bucket, jendela),
-- satu pernyataan, tanpa lock yang ditahan. Cukup untuk menahan brute force
-- login; tidak cukup presisi untuk penagihan, dan memang tidak dipakai begitu.
create table rate_limits (
  bucket       text        not null check (char_length(bucket) between 1 and 200),
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (bucket, window_start)
);

comment on table rate_limits is
  'Penghitung pembatas laju. Hanya disentuh lewat consume_rate_limit(); tidak ada policy RLS, jadi tidak bisa dibaca siapa pun lewat REST.';

-- RLS aktif tanpa satu pun policy = tertutup rapat untuk anon maupun
-- authenticated. Satu-satunya jalan masuk adalah fungsi security definer di
-- bawah, yang tidak pernah mengembalikan isi tabelnya.
alter table rate_limits enable row level security;

create or replace function consume_rate_limit(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
  language plpgsql security definer set search_path = public as $$
    declare
      v_bucket text;
      v_window timestamptz;
      v_hits   integer;
    begin
      if p_limit < 1 or p_window_seconds < 1 then
        raise exception 'p_limit dan p_window_seconds harus positif';
      end if;

      -- Dipotong, bukan ditolak: pemanggil yang sah tidak pernah mengirim
      -- kunci sepanjang ini, dan melempar exception ke jalur login hanya
      -- mengubah penyalahgunaan jadi error yang membingungkan.
      v_bucket := left(p_bucket, 200);

      v_window := to_timestamp(
        floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
      );

      insert into rate_limits (bucket, window_start, hits)
        values (v_bucket, v_window, 1)
        on conflict (bucket, window_start)
        do update set hits = rate_limits.hits + 1
        returning hits into v_hits;

      -- Pembersihan oportunistik. Bucket berisi hash dan bisa dikarang bebas
      -- oleh pemanggil anonim, jadi tabel ini harus punya jalan menyusut tanpa
      -- bergantung pada pg_cron (yang belum terpasang di project ini).
      if random() < 0.02 then
        delete from rate_limits where window_start < now() - interval '1 day';
      end if;

      return v_hits <= p_limit;
    end
  $$;

comment on function consume_rate_limit(text, integer, integer) is
  'Menambah satu hit pada bucket dan mengembalikan true bila masih di dalam batas.';

-- `anon` WAJIB punya EXECUTE: pembatas login harus jalan sebelum ada sesi.
-- Alasannya sama persis dengan post_is_live() di 0002 — fungsinya hanya
-- mengembalikan satu boolean tentang kunci yang pemanggilnya sendiri kirim,
-- dan tidak pernah membocorkan baris siapa pun. Linter Supabase akan menandai
-- ini sebagai temuan sekelas is_admin(); sudah dicatat di PROJECT-SCOPE.md
-- sebagai temuan yang sengaja dibiarkan.
revoke all on function consume_rate_limit(text, integer, integer) from public;
grant execute on function consume_rate_limit(text, integer, integer) to anon, authenticated;

-- --------------------------------------------- 2. rename_post_slug bebas tabrakan

-- Cacat pada versi 0001: post_slug_history.old_slug bersifat UNIQUE, sedangkan
-- fungsinya melakukan INSERT polos. Urutan rename yang wajar — a -> b, lalu
-- kembali b -> a, lalu a -> b lagi — menabrak baris 'a' yang sudah ada dan
-- menggagalkan seluruh rename dengan error 23505 mentah.
--
-- ON CONFLICT memindahkan kepemilikan slug lama ke artikel yang terakhir
-- memakainya. Itu perilaku yang benar untuk redirect: satu URL lama hanya boleh
-- menunjuk satu tujuan, dan tujuannya adalah yang terbaru.
--
-- search_path ikut dideklarasikan di sini karena CREATE OR REPLACE membuang
-- konfigurasi yang dipasang lewat ALTER FUNCTION di 0002.
create or replace function rename_post_slug(p_post_id uuid, p_new_slug text)
  returns void language plpgsql security invoker set search_path = public as $$
    declare v_old text;
    begin
      select slug into v_old from posts where id = p_post_id for update;
      if v_old is null then
        raise exception 'post % not found', p_post_id;
      end if;
      if v_old = p_new_slug then
        return;
      end if;
      insert into post_slug_history (post_id, old_slug)
        values (p_post_id, v_old)
        on conflict (old_slug) do update
          set post_id    = excluded.post_id,
              changed_at = now();
      update posts set slug = p_new_slug where id = p_post_id;
    end
  $$;

revoke all on function rename_post_slug(uuid, text) from public, anon;
grant execute on function rename_post_slug(uuid, text) to authenticated;

-- ------------------------------------------ 3. tinjauan terjemahan jadi basi

-- K2: kalau teks sumber diubah, terjemahannya tidak lagi mencerminkan sumber
-- dan harus ditinjau ulang sebelum terbit.
--
-- SENGAJA HANYA BERLAKU SAAT status = 'draft'. Constraint
-- posts_publish_requires_reviewed_bilingual mensyaratkan translation_status =
-- 'reviewed' bagi setiap artikel published. Menurunkan status tinjauan pada
-- artikel yang sudah terbit berarti pernyataan UPDATE-nya sendiri melanggar
-- constraint — memperbaiki satu huruf salah pada artikel live jadi mustahil.
-- Untuk artikel terbit, editor menampilkan peringatan yang tidak menghalangi
-- penyimpanan.
--
-- Syarat old.translation_status = 'reviewed' penting: bila satu pernyataan
-- sekaligus mengubah isi DAN menandai terjemahan sudah ditinjau, yang lama
-- bernilai 'generated' sehingga penandaan itu tidak ikut dibatalkan.
create or replace function reset_translation_review() returns trigger
  language plpgsql set search_path = public as $$
    begin
      if new.status <> 'draft'
         or old.translation_status <> 'reviewed'
         or new.translation_status <> 'reviewed' then
        return new;
      end if;

      if new.source_locale = 'id' then
        if new.title_id   is distinct from old.title_id
        or new.excerpt_id is distinct from old.excerpt_id
        or new.body_id    is distinct from old.body_id then
          new.translation_status := 'generated';
        end if;
      else
        if new.title_en   is distinct from old.title_en
        or new.excerpt_en is distinct from old.excerpt_en
        or new.body_en    is distinct from old.body_en then
          new.translation_status := 'generated';
        end if;
      end if;

      return new;
    end
  $$;

revoke all on function reset_translation_review() from public, anon, authenticated;

-- Namanya sengaja diawali huruf yang mengurutkannya sebelum
-- posts_touch_updated_at: Postgres menjalankan trigger sejenis menurut abjad,
-- jadi urutannya deterministik dan bukan kebetulan.
create trigger posts_reset_translation_review
  before update on posts
  for each row execute function reset_translation_review();

-- ------------------------------------------------ 4. indeks daftar admin

-- Daftar artikel di dashboard mengurutkan menurut suntingan terakhir dan
-- memuat draft, terjadwal, maupun arsip — jadi indeksnya tidak boleh parsial
-- seperti posts_live_idx.
create index posts_updated_idx on posts (updated_at desc);
