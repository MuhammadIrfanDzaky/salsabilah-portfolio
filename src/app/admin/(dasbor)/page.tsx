import Link from "next/link";
import { redirect } from "next/navigation";
import { adminCopy } from "@/data/admin-copy";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin } from "@/lib/admin/guard";
import {
  STATUS_TABS,
  derivePostStatus,
  isStatusTab,
  statusClasses,
  statusLabel,
  tabLabel,
  type StatusTab,
} from "@/lib/admin/status";
import { countdownTo, formatWib } from "@/lib/time";

/**
 * Daftar artikel.
 *
 * Memuat draft, terjadwal, dan arsip sekaligus — sesuatu yang tidak mungkin
 * dilakukan kunci anonim. Policy `posts_admin_all` yang membuatnya terlihat,
 * dan itu sendiri bukti bahwa sesi ini benar-benar berperan admin di database,
 * bukan sekadar lolos pemeriksaan di aplikasi.
 */

const COLUMNS =
  "id, slug, status, published_at, updated_at, deleted_at, translation_status, source_locale, title_id, title_en";

export default async function DaftarArtikelPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/admin/masuk");

  const { tab: rawTab } = await searchParams;
  const tab: StatusTab = isStatusTab(rawTab) ? rawTab : "semua";

  const { data, error } = await guard.supabase
    .from("posts")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(describeDbError(error, "daftar-artikel"));

  const now = Date.now();
  const semua = (data ?? []).map((post) => ({
    ...post,
    derived: derivePostStatus(post, now),
  }));

  const posts = tab === "semua" ? semua : semua.filter((post) => post.derived === tab);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.01em] text-ink">
          {adminCopy.list.title}
        </h1>
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          {semua.length} artikel
        </p>
      </div>

      <nav aria-label="Saring menurut status" className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((value) => {
          const jumlah =
            value === "semua" ? semua.length : semua.filter((p) => p.derived === value).length;
          const aktif = value === tab;
          return (
            <Link
              key={value}
              href={value === "semua" ? "/admin" : `/admin?tab=${value}`}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13.5px] no-underline transition-colors ${
                aktif
                  ? "border-accent-strong bg-accent-strong text-on-accent"
                  : "border-line text-nav-text hover:text-ink"
              }`}
            >
              {tabLabel(value)}
              <span className="ml-1.5 opacity-60">{jumlah}</span>
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <p className="m-0 rounded-[14px] border border-line bg-surface px-5 py-8 text-center text-muted">
          {semua.length === 0 ? adminCopy.list.empty : adminCopy.list.emptyFiltered}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{adminCopy.list.title}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {adminCopy.list.colTitle}
                </th>
                <th scope="col" className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {adminCopy.list.colStatus}
                </th>
                <th scope="col" className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {adminCopy.list.colPublished}
                </th>
                <th scope="col" className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                  {adminCopy.list.colUpdated}
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const judul =
                  (post.source_locale === "en" ? post.title_en : post.title_id) ||
                  post.title_id ||
                  post.title_en ||
                  post.slug;
                const mundur = post.derived === "scheduled" ? countdownTo(post.published_at) : "";

                return (
                  <tr key={post.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4 align-top">
                      <Link
                        href={`/admin/artikel/${post.id}`}
                        className="font-serif text-[17px] font-semibold text-ink no-underline hover:text-accent-strong"
                      >
                        {judul}
                      </Link>
                      <p className="m-0 mt-1 font-mono text-[11.5px] text-muted">/{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] ${statusClasses(post.derived)}`}
                      >
                        {statusLabel(post.derived)}
                      </span>
                      {mundur ? (
                        <p className="m-0 mt-1 text-[12px] text-muted">{mundur}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top text-[13.5px] text-muted">
                      {formatWib(post.published_at)}
                    </td>
                    <td className="px-5 py-4 align-top text-[13.5px] text-muted">
                      {formatWib(post.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
