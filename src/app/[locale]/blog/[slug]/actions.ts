"use server";

import { createRpcClient } from "@/lib/supabase/rpc";
import { cleanText } from "@/lib/validation";

/**
 * Kiriman pembaca (K3).
 *
 * Aturan sebenarnya ditegakkan di dalam `post_comment()` (migrasi 0006), bukan
 * di sini — pemanggil lewat REST langsung tidak akan melewati file ini sama
 * sekali. Yang ditambahkan lapisan ini adalah dua hal yang memang hanya
 * bermakna di sisi aplikasi: kolom umpan honeypot, dan perapian teks sebelum
 * dikirim.
 */

export type Comment = {
  id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

/**
 * Daftar komentar, dibaca lewat server.
 *
 * Bisa saja dibaca langsung dari peramban dengan kunci publishable — RLS tetap
 * menyaringnya — tapi itu berarti mengirim seluruh pustaka klien Supabase ke
 * setiap pembaca artikel: diukur, +70 kB First Load JS pada halaman yang paling
 * menentukan skor performa dan peringkat pencarian. Lewat Server Action,
 * pustakanya tinggal di server dan yang menyeberang hanya datanya.
 */
export async function listComments(postId: string): Promise<Comment[] | null> {
  if (!postId) return null;

  const supabase = createRpcClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_name, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[komentar] gagal memuat:", error.message);
    return null;
  }
  return data ?? [];
}

/** Keadaan awal tombol suka. Lewat fungsi, karena hak baca tabel likes dicabut. */
export async function hasLiked(postId: string, visitor: string): Promise<boolean> {
  if (!postId || visitor.length < 8) return false;

  const supabase = createRpcClient();
  const { data } = await supabase.rpc("has_liked", {
    p_post_id: postId,
    p_visitor_hash: visitor,
  });
  return data === true;
}

export type CommentResult = { ok: true } | { ok: false; code: string };

export async function submitComment(
  _previous: CommentResult | null,
  formData: FormData,
): Promise<CommentResult> {
  const postId = String(formData.get("postId") ?? "").trim();
  const visitor = String(formData.get("visitor") ?? "").trim();
  const umpan = String(formData.get("situs") ?? "");
  const name = cleanText(String(formData.get("name") ?? ""));
  const body = cleanText(String(formData.get("body") ?? ""));

  /*
   * Kolom umpan disembunyikan dari mata manusia tapi tetap ada di HTML, jadi
   * bot yang mengisi setiap kolom akan mengisinya juga. Balasannya sengaja
   * berupa "berhasil": kalau ditolak dengan pesan galat, pembuat bot langsung
   * tahu kolom mana yang menjebaknya dan tinggal melewatinya.
   */
  if (umpan.trim() !== "") return { ok: true };

  if (!body) return { ok: false, code: "kosong" };
  if (!postId || visitor.length < 8) return { ok: false, code: "umum" };

  const supabase = createRpcClient();
  const { data, error } = await supabase.rpc("post_comment", {
    p_post_id: postId,
    p_author_name: name.length > 0 ? name : null,
    p_body: body,
    p_visitor_hash: visitor,
  });

  if (error) {
    console.error("[komentar] gagal:", error.message);
    return { ok: false, code: "umum" };
  }

  return data === "ok" ? { ok: true } : { ok: false, code: String(data) };
}

export type LikeResult =
  | { ok: true; liked: boolean }
  | { ok: false; code: string };

export async function toggleLike(
  _previous: LikeResult | null,
  formData: FormData,
): Promise<LikeResult> {
  const postId = String(formData.get("postId") ?? "").trim();
  const visitor = String(formData.get("visitor") ?? "").trim();

  if (!postId || visitor.length < 8) return { ok: false, code: "umum" };

  const supabase = createRpcClient();
  const { data, error } = await supabase.rpc("toggle_like", {
    p_post_id: postId,
    p_visitor_hash: visitor,
  });

  if (error) {
    console.error("[like] gagal:", error.message);
    return { ok: false, code: "umum" };
  }

  if (data === "suka") return { ok: true, liked: true };
  if (data === "batal") return { ok: true, liked: false };
  return { ok: false, code: String(data) };
}
