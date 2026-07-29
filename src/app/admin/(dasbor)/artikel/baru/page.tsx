import { redirect } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { adminCopy } from "@/data/admin-copy";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function ArtikelBaruPage() {
  const guard = await requireAdmin();
  if (!guard.ok) redirect("/admin/masuk");

  const { data: categories, error } = await guard.supabase
    .from("categories")
    .select("id, name_id")
    .order("sort_order");

  if (error) throw new Error(describeDbError(error, "muat-kategori"));

  const pilihan = categories ?? [];

  return (
    <>
      <h1 className="m-0 mb-7 font-serif text-[30px] font-semibold tracking-[-0.01em] text-ink">
        {adminCopy.editor.titleNew}
      </h1>

      <div className="flex flex-col gap-8">
        <PostForm
          categories={pilihan}
          post={{
            id: null,
            slug: "",
            category_id: pilihan[0]?.id ?? "",
            source_locale: "id",
            status: "draft",
            translation_status: "pending",
            published_at: null,
            deleted_at: null,
            cover_path: null,
            title_id: "",
            title_en: "",
            excerpt_id: "",
            excerpt_en: "",
            body_id: "",
            body_en: "",
            cover_alt_id: "",
            cover_alt_en: "",
          }}
        />
      </div>
    </>
  );
}
