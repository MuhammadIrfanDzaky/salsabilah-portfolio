-- Storage untuk cover image artikel (competency 22 — File & Media).
--
-- Syarat dari modifier +public-ugc yang dipenuhi di sini:
--   * batas ukuran         -> file_size_limit pada bucket
--   * tipe dibatasi        -> allowed_mime_types (SVG SENGAJA DILARANG:
--                             bisa memuat <script> dan jadi vektor XSS)
--   * origin terpisah      -> objek disajikan dari <ref>.supabase.co,
--                             bukan dari domain aplikasi
--   * tidak pernah dieksekusi -> hanya tipe raster, disajikan sebagai gambar
--
-- Pemeriksaan tipe BERBASIS ISI (bukan sekadar percaya header Content-Type)
-- dilakukan di server sebelum unggah, lihat src/lib/covers.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-covers',
  'post-covers',
  true,                                     -- cover artikel memang publik
  5242880,                                  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public            = excluded.public;

-- Siapa pun boleh melihat cover; hanya admin yang boleh menaruh, mengganti,
-- atau menghapusnya.
create policy "cover publik boleh dibaca"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-covers');

create policy "hanya admin boleh unggah cover"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-covers' and is_admin());

create policy "hanya admin boleh ganti cover"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-covers' and is_admin())
  with check (bucket_id = 'post-covers' and is_admin());

create policy "hanya admin boleh hapus cover"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-covers' and is_admin());
