import { adminCopy } from "@/data/admin-copy";

/**
 * Status yang dilihat Salsabilah, diturunkan — bukan disimpan.
 *
 * Kolom `posts.status` di database hanya mengenal 'draft' dan 'published', dan
 * sengaja tidak ditambahi nilai 'scheduled'. Terjadwal bukan keadaan
 * tersendiri: ia artikel published yang `published_at`-nya belum lewat, dan
 * `post_is_live()` yang memutuskan kapan ia muncul. Menyimpannya sebagai nilai
 * keempat berarti ada dua sumber kebenaran yang bisa berselisih.
 */

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export type StatusInput = {
  status: string;
  published_at: string | null;
  deleted_at: string | null;
};

export function derivePostStatus(post: StatusInput, now: number = Date.now()): PostStatus {
  if (post.deleted_at) return "archived";
  if (post.status !== "published") return "draft";
  if (!post.published_at) return "draft";
  return new Date(post.published_at).getTime() > now ? "scheduled" : "published";
}

export function statusLabel(status: PostStatus): string {
  return adminCopy.status[status];
}

/** Kelas warna per status. Memakai token yang sama dengan situs publik. */
export function statusClasses(status: PostStatus): string {
  switch (status) {
    case "published":
      return "border-green/30 bg-green/10 text-green";
    case "scheduled":
      return "border-accent-strong/40 bg-accent/10 text-accent-strong";
    case "archived":
      return "border-line bg-muted/10 text-muted";
    default:
      return "border-line bg-surface text-muted";
  }
}

export const STATUS_TABS = ["semua", "draft", "scheduled", "published", "archived"] as const;
export type StatusTab = (typeof STATUS_TABS)[number];

export function isStatusTab(value: string | undefined): value is StatusTab {
  return !!value && (STATUS_TABS as readonly string[]).includes(value);
}

export function tabLabel(tab: StatusTab): string {
  return tab === "semua" ? adminCopy.list.tabAll : adminCopy.status[tab];
}
