-- Fase 2: komentar dan like lewat RPC, bukan INSERT langsung.
--
-- Migrasi 0001 menulis asumsi ini pada policy comments_public_insert:
--
--   "Rate limiting, honeypot and link heuristics live in the route handler;
--    this is the last line, not the first."
--
-- Asumsi itu keliru. `anon` punya grant INSERT di tabel comments dan likes,
-- dan kunci publishable ada di source setiap halaman. Siapa pun bisa
-- POST /rest/v1/comments langsung tanpa pernah menyentuh aplikasi, sehingga
-- seluruh mitigasi K3 — rate limit, honeypot, batas panjang, heuristik tautan,
-- sanitasi — terlewat begitu saja. Untuk komentar tanpa antrean moderasi, itu
-- berarti spam langsung tayang.
--
-- Karena itu jalur INSERT ditutup dan diganti dua fungsi security definer.
-- Pemanggil lewat REST langsung tunduk pada aturan yang persis sama.

-- ------------------------------------------------------- 1. tutup jalur lama

drop policy if exists comments_public_insert on comments;
drop policy if exists likes_public_insert on likes;

revoke insert on comments from anon, authenticated;
revoke insert on likes    from anon, authenticated;
revoke delete on likes    from anon, authenticated;

-- Indeks untuk halaman moderasi, yang menampilkan komentar terbaru lintas
-- artikel termasuk yang sudah dihapus.
create index comments_moderation_idx on comments (created_at desc);

-- ------------------------------------------------ 2. batas laju yang dipakai

/*
 * Tiga ember, dan pembagian tugasnya disengaja.
 *
 * Ember per-pengunjung memakai hash yang dikirim aplikasi. Aplikasi
 * menurunkannya dari IP asli pengunjung, yang hanya terlihat di sana:
 * permintaan dari aplikasi sampai ke Postgres lewat server Vercel, sehingga
 * IP yang terlihat database sama untuk semua pengunjung. Memakai IP itu
 * sebagai kunci akan membuat satu orang berkomentar memblokir semua orang.
 *
 * Konsekuensinya hash itu bisa dikarang oleh pemanggil langsung. Karena itu
 * yang benar-benar menahan penyalahgunaan adalah ember per-artikel dan ember
 * global: penyerang boleh memutar hash sesukanya, tapi sasarannya tetap satu
 * post_id, dan itu tidak bisa dipalsukan.
 */
create or replace function comment_rate_ok(p_post_id uuid, p_visitor_hash text)
  returns boolean language plpgsql security definer set search_path = public as $$
    begin
      -- 5 komentar per 10 menit dari satu pengunjung
      if not consume_rate_limit('komentar-pengunjung:' || p_visitor_hash, 5, 600) then
        return false;
      end if;
      -- 30 per jam pada satu artikel
      if not consume_rate_limit('komentar-artikel:' || p_post_id::text, 30, 3600) then
        return false;
      end if;
      -- 100 per jam di seluruh situs
      if not consume_rate_limit('komentar-global', 100, 3600) then
        return false;
      end if;
      return true;
    end
  $$;

revoke all on function comment_rate_ok(uuid, text) from public, anon, authenticated;

-- --------------------------------------------------------- 3. kirim komentar

/*
 * Mengembalikan kode hasil, bukan melempar exception, supaya aplikasi bisa
 * memilih kalimat untuk pembaca tanpa menebak-nebak isi pesan Postgres:
 *
 *   ok             komentar tersimpan
 *   artikel-mati   artikel tidak ada, belum terbit, atau sudah diarsipkan
 *   terlalu-cepat  salah satu batas laju terlampaui
 *   kosong         isi komentar kosong setelah dirapikan
 *   kepanjangan    isi lebih dari 2000 karakter
 *   nama-panjang   nama lebih dari 60 karakter
 *   terlalu-banyak-tautan   lebih dari dua tautan
 *
 * Honeypot TIDAK ada di sini: kolom umpan itu hanya bermakna di dalam HTML
 * yang dikirim aplikasi, dan pemanggil langsung tinggal tidak mengisinya.
 * Yang ditegakkan di lapisan ini adalah yang tetap berlaku bagi semua orang.
 */
create or replace function post_comment(
  p_post_id      uuid,
  p_author_name  text,
  p_body         text,
  p_visitor_hash text
) returns text
  language plpgsql security definer set search_path = public as $$
    declare
      v_body  text;
      v_name  text;
      v_links integer;
    begin
      if p_visitor_hash is null or length(p_visitor_hash) < 8 then
        return 'kosong';
      end if;

      if not exists (select 1 from posts p where p.id = p_post_id and post_is_live(p)) then
        return 'artikel-mati';
      end if;

      v_body := btrim(coalesce(p_body, ''));
      v_name := nullif(btrim(coalesce(p_author_name, '')), '');

      if v_body = '' then
        return 'kosong';
      end if;
      if length(v_body) > 2000 then
        return 'kepanjangan';
      end if;
      if v_name is not null and length(v_name) > 60 then
        return 'nama-panjang';
      end if;

      -- Dua tautan masih wajar untuk menunjuk sumber; lebih dari itu pola spam.
      v_links := (length(lower(v_body)) - length(replace(lower(v_body), 'http', ''))) / 4;
      if v_links > 2 then
        return 'terlalu-banyak-tautan';
      end if;

      -- Batas laju dihitung setelah validasi bentuk, supaya percobaan yang
      -- jelas salah tidak ikut menghabiskan jatah pengunjung yang jujur.
      if not comment_rate_ok(p_post_id, p_visitor_hash) then
        return 'terlalu-cepat';
      end if;

      insert into comments (post_id, author_name, body, visitor_hash)
      values (p_post_id, v_name, v_body, p_visitor_hash);

      return 'ok';
    end
  $$;

revoke all on function post_comment(uuid, text, text, text) from public;
grant execute on function post_comment(uuid, text, text, text) to anon, authenticated;

-- -------------------------------------------------------------- 4. like

/*
 * Idempoten lewat primary key gabungan (post_id, visitor_hash) yang sudah ada
 * di 0001; memanggil ini dua kali dengan hash sama akan menyalakan lalu
 * mematikan, bukan menghitung dua kali.
 *
 * Mengembalikan 'suka', 'batal', 'artikel-mati', atau 'terlalu-cepat'.
 */
create or replace function toggle_like(p_post_id uuid, p_visitor_hash text)
  returns text language plpgsql security definer set search_path = public as $$
    declare v_ada boolean;
    begin
      if p_visitor_hash is null or length(p_visitor_hash) < 8 then
        return 'artikel-mati';
      end if;

      if not exists (select 1 from posts p where p.id = p_post_id and post_is_live(p)) then
        return 'artikel-mati';
      end if;

      -- Ember per-artikel saja: like tidak menyimpan teks, jadi yang perlu
      -- dijaga hanya penggelembungan angka pada satu artikel.
      if not consume_rate_limit('like-artikel:' || p_post_id::text, 200, 3600) then
        return 'terlalu-cepat';
      end if;

      select exists (
        select 1 from likes l
        where l.post_id = p_post_id and l.visitor_hash = p_visitor_hash
      ) into v_ada;

      if v_ada then
        delete from likes where post_id = p_post_id and visitor_hash = p_visitor_hash;
        return 'batal';
      end if;

      insert into likes (post_id, visitor_hash) values (p_post_id, p_visitor_hash)
      on conflict do nothing;
      return 'suka';
    end
  $$;

revoke all on function toggle_like(uuid, text) from public;
grant execute on function toggle_like(uuid, text) to anon, authenticated;

-- ------------------------------------------------- 5. apakah sudah menyukai

/*
 * Dibutuhkan supaya tombol like tampil dalam keadaan yang benar saat halaman
 * dimuat. Dibuat sebagai fungsi, bukan SELECT biasa ke tabel likes, karena
 * membaca baris likes berarti bisa mendaftar hash pengunjung lain.
 */
create or replace function has_liked(p_post_id uuid, p_visitor_hash text)
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from likes l
      where l.post_id = p_post_id and l.visitor_hash = p_visitor_hash
    )
  $$;

revoke all on function has_liked(uuid, text) from public;
grant execute on function has_liked(uuid, text) to anon, authenticated;

-- Kebijakan baca pada likes kini tidak diperlukan lagi dan hanya membocorkan
-- daftar hash pengunjung. Jumlah like sudah tersimpan di posts.like_count.
drop policy if exists likes_public_read on likes;
revoke select on likes from anon;
