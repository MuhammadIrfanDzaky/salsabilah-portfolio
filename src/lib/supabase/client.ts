"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

/**
 * Browser client — used by the admin login form and by the like/comment
 * widgets. Carries only the publishable key, which is safe to ship: every
 * table is protected by Row Level Security, so the key alone grants nothing
 * beyond what an anonymous visitor may already read.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
