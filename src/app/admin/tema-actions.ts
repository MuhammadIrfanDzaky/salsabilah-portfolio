"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { TEMA_COOKIE, isTemaAdmin } from "@/lib/admin/tema";

/**
 * Menyimpan pilihan tema dasbor.
 *
 * **Ini satu-satunya Server Action di dasbor yang TIDAK dibuka dengan
 * `requireAdmin()`, dan itu disengaja.** Aturan "requireAdmin() di baris
 * pertama setiap action" ada karena Server Action adalah endpoint POST publik;
 * pengecualian di sini sah hanya selama action ini memenuhi ketiganya:
 *
 *   - Ia harus bisa dipakai SEBELUM masuk. Penyetel tema muncul di halaman
 *     masuk, dan di sana belum ada sesi apa pun untuk diperiksa.
 *   - Ia tidak menyentuh database, Storage, maupun sesi — hanya satu cookie
 *     preferensi milik peramban pemanggil sendiri.
 *   - Nilainya divalidasi terhadap enum tertutup, jadi yang bisa ditulis
 *     penyerang ke cookie-nya sendiri hanyalah salah satu dari tiga kata yang
 *     sudah kita tentukan.
 *
 * Kalau kelak action ini tumbuh melewati salah satu batas itu — menyimpan
 * preferensi ke tabel `profiles`, misalnya — gate-nya wajib dipasang, dan
 * penyetel di halaman masuk harus dipisah dari yang di dalam dasbor.
 */
export async function setTemaAdmin(formData: FormData): Promise<void> {
  const pilihan = String(formData.get("tema") ?? "");
  // Nilai asing diabaikan diam-diam. Tidak ada pesan galat yang berguna untuk
  // ditampilkan: kontrolnya berupa tombol, jadi nilai di luar enum hanya bisa
  // datang dari permintaan yang dirakit tangan.
  if (!isTemaAdmin(pilihan)) return;

  const jar = await cookies();

  if (pilihan === "sistem") {
    // Dihapus, bukan disimpan sebagai "sistem": ketiadaan cookie DAN nilai
    // "sistem" berarti hal yang sama, dan menyimpan yang bisa dihapus hanya
    // menambah keadaan yang harus dijaga tetap sinkron.
    jar.delete(TEMA_COOKIE);
  } else {
    jar.set(TEMA_COOKIE, pilihan, {
      // Dibatasi ke /admin supaya preferensi dasbor tidak ikut terkirim pada
      // setiap permintaan halaman publik — yang disajikan dari cache CDN dan
      // tidak punya urusan dengan cookie ini.
      path: "/admin",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      // Tidak ada JavaScript yang perlu membacanya; servernya yang memutuskan.
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Temanya dipasang di `admin/layout.tsx`, jadi yang harus dihitung ulang
  // adalah layout-nya — bukan sekadar halaman yang kebetulan memuat tombolnya.
  revalidatePath("/admin", "layout");
}
