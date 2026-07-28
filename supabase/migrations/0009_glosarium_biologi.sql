-- Glosarium: istilah biologi & perlebahan.
--
-- Glosarium awal (migrasi 0001) seluruhnya istilah ekonometrika dan
-- perdagangan — RCA, ARDL, gravity model, CPO. Itu cocok untuk artikel yang
-- diperkirakan akan ditulis Salsabilah, dan meleset untuk artikel yang
-- benar-benar ditulisnya duluan: catatan lapangan tentang lebah kelulut,
-- penuh nama takson dan istilah perlebahan.
--
-- Akibatnya bukan sekadar "kurang lengkap". `missingTerms()` hanya memeriksa
-- istilah yang **terdaftar**, jadi nama spesies yang diterjemahkan mesin akan
-- lolos tanpa satu pun peringatan — penjaganya diam justru saat paling
-- dibutuhkan. Nama ilmiah yang berubah di artikel akademik adalah kesalahan
-- yang mempermalukan penulisnya.
--
-- Pelajarannya dicatat, bukan cuma ditambal: glosarium adalah data yang harus
-- ikut tumbuh bersama topik, dan pemicunya adalah setiap artikel pertama di
-- bidang baru.

insert into translation_glossary (term, note) values
  -- Takson. Nama ilmiah tidak pernah diterjemahkan ke bahasa apa pun.
  ('Meliponini',              'Nama tribus lebah tanpa sengat; nama ilmiah, jangan diterjemahkan'),
  ('Heterotrigona itama',     'Nama spesies; jangan diterjemahkan'),
  ('Geniotrigona thoracica',  'Nama spesies; jangan diterjemahkan'),
  ('Tetragonula laeviceps',   'Nama spesies; jangan diterjemahkan'),
  ('Hermetia illucens',       'Nama spesies (lalat tentara hitam); jangan diterjemahkan'),
  ('Haptoncus luteolus',      'Nama spesies (kumbang polen); jangan diterjemahkan'),

  -- Istilah perlebahan yang dipakai apa adanya di kedua bahasa.
  ('propolis',                'Dipakai apa adanya di kedua bahasa'),
  ('bee bread',               'Istilah baku perlebahan; dipakai apa adanya di kedua bahasa'),

  -- Nama lokal. Padanan Inggrisnya "stingless bee" merujuk kelompoknya, bukan
  -- sebutan lokalnya — menerjemahkannya menghapus konteks Asia Tenggara yang
  -- justru jadi isi artikelnya.
  ('kelulut',                 'Nama lokal lebah tanpa sengat di Indonesia & Malaysia; pertahankan')
on conflict (term) do nothing;
