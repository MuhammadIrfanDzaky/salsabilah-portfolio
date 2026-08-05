import { setTemaAdmin } from "@/app/admin/tema-actions";
import { adminCopy } from "@/data/admin-copy";
import type { TemaAdmin } from "@/lib/admin/tema";

/**
 * Penyetel tema dasbor: Sistem / Terang / Gelap.
 *
 * Server Component berisi satu `<form>` dengan tiga tombol submit, bukan
 * komponen klien ber-`onClick`. Konsekuensinya ia ikut bekerja saat JavaScript
 * gagal dimuat, sama seperti formulir masuk dan formulir artikel — dan tidak
 * menambah satu byte pun ke bundel dasbor.
 *
 * Tiga pilihan, bukan dua. "Sistem" adalah keadaan bawaan dan harus bisa
 * dipilih kembali: tanpa opsi itu, sekali seseorang menekan Terang atau Gelap,
 * dasbor berhenti mengikuti setelan perangkat selamanya dan tidak ada jalan
 * pulang selain menghapus cookie.
 */
export function ThemeSwitch({ aktif }: { aktif: TemaAdmin }) {
  const pill =
    "inline-flex h-7 w-8 items-center justify-center rounded-full transition-colors cursor-pointer border-0 bg-transparent";

  const opsi: { nilai: TemaAdmin; label: string; ikon: React.ReactNode }[] = [
    {
      nilai: "sistem",
      label: adminCopy.tema.sistem,
      ikon: (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 16.5 H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      nilai: "terang",
      label: adminCopy.tema.terang,
      ikon: (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.5 V3.5 M10 16.5 V18.5 M1.5 10 H3.5 M16.5 10 H18.5 M4 4 L5.4 5.4 M14.6 14.6 L16 16 M16 4 L14.6 5.4 M5.4 14.6 L4 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      nilai: "gelap",
      label: adminCopy.tema.gelap,
      ikon: (
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M17 12.5 A7.5 7.5 0 0 1 7.5 3 A7.5 7.5 0 1 0 17 12.5 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <form
      action={setTemaAdmin}
      role="group"
      aria-label={adminCopy.tema.group}
      className="inline-flex items-center gap-[2px] rounded-full border border-line bg-surface p-[3px]"
    >
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="submit"
          name="tema"
          value={o.nilai}
          aria-label={o.label}
          title={o.label}
          // `aria-pressed` dan bukan sekadar warna: pembaca layar tidak bisa
          // melihat pil yang tersorot.
          aria-pressed={aktif === o.nilai}
          className={`${pill} ${
            aktif === o.nilai ? "bg-green text-on-green" : "text-muted hover:text-ink"
          }`}
        >
          {o.ikon}
        </button>
      ))}
    </form>
  );
}
