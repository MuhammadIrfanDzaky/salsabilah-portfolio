import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LifecyclePanel, TranslationPanel } from "@/components/admin/post-side-actions";
import { PostForm } from "@/components/admin/post-form";
import { adminCopy } from "@/data/admin-copy";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin } from "@/lib/admin/guard";
import { derivePostStatus, statusClasses, statusLabel } from "@/lib/admin/status";
import { coverUrl } from "@/lib/blog";
import { formatWib } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function SuntingArtikelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cover?: string }>;
}) {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/admin/masuk");

  const { id } = await params;
  // Ditulis oleh `saveArticle` ketika artikelnya tersimpan tapi covernya tidak.
  // Alihannya tetap dilakukan supaya tidak lahir baris kedua; penandalah yang
  // memberi tahu apa yang belum beres.
  const coverGagal = (await searchParams).cover === "gagal";

  const [{ data: post, error }, { data: categories }] = await Promise.all([
    guard.supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    guard.supabase.from("categories").select("id, name_id").order("sort_order"),
  ]);

  if (error) throw new Error(describeDbError(error, "muat-artikel"));
  if (!post) notFound();

  const status = derivePostStatus(post);

  return (
    <>
      <div className="mb-7">
        <Link
          href="/admin"
          className="mb-3 inline-block font-mono text-[12px] uppercase tracking-[0.12em] text-muted no-underline hover:text-ink"
        >
          ← {adminCopy.nav.posts}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.01em] text-ink">
            {adminCopy.editor.titleEdit}
          </h1>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] ${statusClasses(status)}`}
          >
            {statusLabel(status)}
          </span>
        </div>

        <p className="m-0 mt-2 font-mono text-[12px] text-muted">
          /{post.slug} · disunting {formatWib(post.updated_at)}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {coverGagal ? (
          <div
            role="alert"
            className="rounded-[12px] border border-accent-strong/40 bg-accent/10 px-4 py-3 text-[14px] text-ink"
          >
            {adminCopy.editor.coverFailedAfterSave}
          </div>
        ) : null}

        <PostForm
          categories={categories ?? []}
          post={post}
          coverUrl={coverUrl(post.cover_path)}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <TranslationPanel
              translationStatus={post.translation_status}
              // Peringatan hanya relevan untuk artikel yang sudah publik:
              // trigger di database sudah menurunkan status tinjauan sendiri
              // selama artikel masih draft (lihat migrasi 0005).
              showSourceEditedWarning={status === "published" || status === "scheduled"}
            />

            <LifecyclePanel postId={post.id} slug={post.slug} status={status} />
          </div>
        </div>
      </div>
    </>
  );
}
