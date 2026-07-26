-- Menutup temuan linter: public_bucket_allows_listing.
--
-- Kebijakan SELECT di 0003 membuat bucket bisa DIDAFTAR isinya, bukan sekadar
-- dibaca per objek. Akibatnya cover artikel yang masih draft dapat ditemukan
-- lewat enumerasi sebelum artikelnya terbit — kebocoran yang halus tapi nyata.
--
-- Bucket dengan public = true melayani URL /storage/v1/object/public/... tanpa
-- melewati RLS sama sekali, jadi gambar tetap tampil setelah kebijakan ini
-- dihapus. Yang hilang hanyalah kemampuan mendaftar isi bucket.

drop policy if exists "cover publik boleh dibaca" on storage.objects;

-- Admin tetap perlu bisa melihat daftar isinya untuk mengelola cover.
create policy "hanya admin boleh mendaftar cover"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'post-covers' and is_admin());
