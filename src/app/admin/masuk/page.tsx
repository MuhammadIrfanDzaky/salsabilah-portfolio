import { redirect } from "next/navigation";
import { adminCopy } from "@/data/admin-copy";
import { requireAdmin, safeNextPath } from "@/lib/admin/guard";
import { LoginForm } from "./login-form";

/**
 * Halaman masuk. Berada di bawah `admin/layout.tsx` yang tidak memasang gate,
 * jadi ia bisa dijangkau tanpa sesi — itu memang gunanya.
 */
export const dynamic = "force-dynamic";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string }>;
}) {
  const { lanjut } = await searchParams;
  const next = safeNextPath(lanjut);

  // Sudah masuk dan berwenang: tidak ada gunanya menampilkan formulir lagi.
  const guard = await requireAdmin();
  if (guard.ok) redirect(next);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px]">
        <p className="m-0 mb-3 flex items-center gap-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-accent-strong">
          <span aria-hidden="true" className="h-px w-9 flex-none bg-sand" />
          <span>{adminCopy.brand}</span>
        </p>

        <h1 className="m-0 mb-2 font-serif text-[34px] font-semibold leading-tight tracking-[-0.01em] text-ink">
          {adminCopy.login.title}
        </h1>
        <p className="m-0 mb-8 text-[15px] text-muted">{adminCopy.login.lead}</p>

        <LoginForm lanjut={next} />

        <p className="mt-8 m-0 text-[13px] leading-relaxed text-muted">{adminCopy.login.lupa}</p>
      </div>
    </main>
  );
}
