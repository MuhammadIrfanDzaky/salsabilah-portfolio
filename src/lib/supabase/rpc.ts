import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

/**
 * Klien untuk pemanggilan RPC dari sisi server.
 *
 * Tanpa penimpaan cache milik `createPublicClient()`. Panggilan RPC memakai
 * POST dan karena itu tidak ikut di-cache Next, tapi menggantungkan pembatas
 * laju dan penulisan komentar pada detail itu terlalu halus untuk dijadikan
 * jaminan: sekali saja salah di-cache, batasnya berhenti membatasi tanpa
 * memberi tanda apa pun.
 *
 * Cookie-nya juga sengaja tidak ikut. Fungsi yang dipanggil dari sini
 * (`post_comment`, `toggle_like`, `consume_rate_limit`) semuanya
 * `security definer` dan tidak peduli siapa pemanggilnya — yang menjaga
 * batasannya ada di dalam fungsi itu sendiri.
 */
export function createRpcClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
