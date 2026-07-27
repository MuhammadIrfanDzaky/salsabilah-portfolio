-- Menutup translation_runs dari `anon` di tingkat hak akses, bukan hanya RLS.
--
-- Setelah 0007, kunci anonim menerima 200 dengan array kosong: policy hanya
-- menyebut `authenticated`, jadi RLS menyaring semua baris. Tidak ada kebocoran
-- hari ini — tapi yang menahannya cuma satu policy. Satu policy baru yang
-- ditulis longgar di kemudian hari akan membukanya kembali tanpa ada yang
-- menyadari.
--
-- Mencabut grant SELECT membuat penolakannya berlapis dua, sama seperti tabel
-- `likes` di migrasi 0006. Angka pemakaian token tidak punya alasan untuk bisa
-- dibaca pembaca blog: ia menakar volume kerja Salsabilah dan biaya operasional
-- situs.

revoke select on translation_runs from anon;
