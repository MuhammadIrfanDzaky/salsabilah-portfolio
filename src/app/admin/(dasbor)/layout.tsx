import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeSwitch } from "@/components/admin/theme-switch";
import { adminCopy } from "@/data/admin-copy";
import { requireAdmin } from "@/lib/admin/guard";
import { bacaTemaAdmin } from "@/lib/admin/tema";
import { signOut } from "../masuk/actions";

/**
 * Gate autentikasi dasbor.
 *
 * Ditaruh di route group `(dasbor)` — tanda kurung membuatnya tidak menambah
 * segmen URL, jadi halamannya tetap di `/admin` — karena gate tidak bisa
 * dipasang di `admin/layout.tsx`: halaman masuk ada di bawah layout itu dan
 * akan mengarahkan ulang ke dirinya sendiri tanpa henti.
 *
 * Gate ini kenyamanan tampilan, BUKAN batas keamanan. Layout tidak dijalankan
 * sebelum sebuah Server Action, jadi otorisasi yang sebenarnya diputuskan
 * `requireAdmin()` di awal setiap action, lalu ditolak sekali lagi oleh RLS.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function SproutMark() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true" className="flex-none">
      <path d="M10 21 V5" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 13 C5.5 12 2.5 8.5 2 3.5 C7 4.5 9.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <path d="M10 13 C14.5 12 17.5 8.5 18 3.5 C13 4.5 10.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <circle cx="10" cy="2.6" r="1.3" fill="var(--sage)" />
    </svg>
  );
}

export default async function DasborLayout({ children }: { children: React.ReactNode }) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/admin/masuk");

  const tema = await bacaTemaAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-[68px] max-w-[1160px] items-center gap-6 px-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5 text-ink no-underline">
            <SproutMark />
            <span className="truncate font-serif text-[19px] font-semibold tracking-[0.01em]">
              {adminCopy.brand}
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-5">
            <Link
              href="/admin"
              className="text-[14.5px] text-nav-text no-underline hover:text-ink"
            >
              {adminCopy.nav.posts}
            </Link>
            <Link
              href="/admin/komentar"
              className="text-[14.5px] text-nav-text no-underline hover:text-ink"
            >
              {adminCopy.nav.comments}
            </Link>
            <Link
              href="/admin/artikel/baru"
              className="inline-flex items-center rounded-full bg-accent-strong px-4 py-2 text-[14px] font-semibold text-on-accent no-underline transition-opacity hover:opacity-85"
            >
              {adminCopy.nav.newPost}
            </Link>
            <ThemeSwitch aktif={tema} />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-line px-4 py-2 text-[14px] text-nav-text transition-colors hover:text-ink"
              >
                {adminCopy.nav.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-[clamp(28px,4vw,48px)]">
        {children}
      </main>
    </div>
  );
}
