import Link from "next/link";
import { redirect } from "next/navigation";
import { CommentRowActions } from "@/components/admin/comment-row-actions";
import { adminCopy } from "@/data/admin-copy";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin } from "@/lib/admin/guard";
import { formatWib } from "@/lib/time";

/**
 * Halaman moderasi.
 *
 * Memuat komentar yang sudah dihapus juga — sesuatu yang tidak mungkin dilihat
 * kunci anonim, karena `comments_public_read` menyaring `deleted_at is null`.
 * Yang membuatnya terlihat di sini adalah policy `comments_admin_all`.
 */

export const dynamic = "force-dynamic";

const TABS = ["tayang", "dihapus", "semua"] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | undefined): value is Tab {
  return !!value && (TABS as readonly string[]).includes(value);
}

function tabLabel(tab: Tab) {
  if (tab === "tayang") return adminCopy.moderation.tabVisible;
  if (tab === "dihapus") return adminCopy.moderation.tabDeleted;
  return adminCopy.moderation.tabAll;
}

export default async function ModerasiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/admin/masuk");

  const { tab: raw } = await searchParams;
  const tab: Tab = isTab(raw) ? raw : "tayang";

  const { data, error } = await guard.supabase
    .from("comments")
    .select("id, body, author_name, created_at, deleted_at, posts(slug, title_id, title_en)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(describeDbError(error, "daftar-komentar"));

  const semua = data ?? [];
  const komentar =
    tab === "semua"
      ? semua
      : semua.filter((c) => (tab === "dihapus" ? c.deleted_at !== null : c.deleted_at === null));

  const jumlah = (t: Tab) =>
    t === "semua"
      ? semua.length
      : semua.filter((c) => (t === "dihapus" ? c.deleted_at !== null : c.deleted_at === null))
          .length;

  return (
    <>
      <h1 className="m-0 mb-2 font-serif text-[30px] font-semibold tracking-[-0.01em] text-ink">
        {adminCopy.moderation.title}
      </h1>
      <p className="m-0 mb-7 max-w-[62ch] text-[14.5px] text-muted">{adminCopy.moderation.lead}</p>

      <nav aria-label="Saring komentar" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((value) => {
          const aktif = value === tab;
          return (
            <Link
              key={value}
              href={value === "tayang" ? "/admin/komentar" : `/admin/komentar?tab=${value}`}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-[13.5px] no-underline transition-colors ${
                aktif
                  ? "border-accent-strong bg-accent-strong text-on-accent"
                  : "border-line text-nav-text hover:text-ink"
              }`}
            >
              {tabLabel(value)}
              <span className="ml-1.5 opacity-60">{jumlah(value)}</span>
            </Link>
          );
        })}
      </nav>

      {komentar.length === 0 ? (
        <p className="m-0 rounded-[14px] border border-line bg-surface px-5 py-8 text-center text-muted">
          {semua.length === 0 ? adminCopy.moderation.empty : adminCopy.moderation.emptyFiltered}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {komentar.map((c) => {
            const artikel = Array.isArray(c.posts) ? c.posts[0] : c.posts;
            const judul = artikel?.title_id || artikel?.title_en || artikel?.slug || "—";

            return (
              <li
                key={c.id}
                className={`rounded-[14px] border bg-surface p-5 ${
                  c.deleted_at ? "border-line opacity-70" : "border-line"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[14.5px] font-semibold text-ink">
                    {c.author_name?.trim() || adminCopy.moderation.anonymous}
                  </span>
                  <time className="font-mono text-[11.5px] text-muted">
                    {formatWib(c.created_at)}
                  </time>
                  {c.deleted_at ? (
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                      {adminCopy.moderation.deletedAt} {formatWib(c.deleted_at)}
                    </span>
                  ) : null}
                </div>

                {/* Teks pembaca, dirender sebagai teks. Tidak pernah HTML. */}
                <p className="m-0 mb-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/90">
                  {c.body}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 text-[12.5px] text-muted">
                    {adminCopy.moderation.onArticle}{" "}
                    {artikel?.slug ? (
                      <Link
                        href={`/id/blog/${artikel.slug}`}
                        className="text-accent-strong underline"
                      >
                        {judul}
                      </Link>
                    ) : (
                      judul
                    )}
                  </p>
                  <CommentRowActions commentId={c.id} deleted={c.deleted_at !== null} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
