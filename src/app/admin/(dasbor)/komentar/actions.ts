"use server";

import { revalidatePath } from "next/cache";
import { describeDbError } from "@/lib/admin/errors";
import { requireAdmin, type ActionResult } from "@/lib/admin/guard";

/**
 * Moderasi komentar (K3).
 *
 * Menghapus selalu lunak: `deleted_at` diisi, barisnya tetap ada. Policy
 * `comments_public_read` sudah menyaring `deleted_at is null`, jadi begitu
 * kolom itu terisi komentarnya hilang dari pembaca — tanpa perlu satu pun
 * penyaringan di sisi aplikasi.
 *
 * Tidak ada jalur hapus permanen di sini. Kalau kelak dibutuhkan, ia harus
 * meniru pola artikel: hanya untuk yang sudah dihapus lunak, dan dengan
 * konfirmasi yang diketik.
 */

async function ubahKomentar(
  commentId: string,
  deletedAt: string | null,
  context: string,
  message: string,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, message: guard.message };
  if (!commentId) return { ok: false, message: "Komentar tidak ditemukan." };

  const { error } = await guard.supabase
    .from("comments")
    .update({ deleted_at: deletedAt })
    .eq("id", commentId);

  if (error) return { ok: false, message: describeDbError(error, context) };

  revalidatePath("/admin/komentar");
  return { ok: true, message };
}

export async function deleteComment(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("commentId") ?? "");
  return ubahKomentar(id, new Date().toISOString(), "hapus-komentar", "Komentar dihapus.");
}

export async function restoreComment(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("commentId") ?? "");
  return ubahKomentar(id, null, "pulihkan-komentar", "Komentar dipulihkan.");
}
