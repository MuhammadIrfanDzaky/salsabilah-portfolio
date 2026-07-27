"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

/**
 * Browser client — reserved for the Phase 2 like and comment widgets.
 *
 * Deliberately NOT used by the admin login form: signing in runs as a Server
 * Action instead, so the form still works without JavaScript and the password
 * never has to be handled by a client bundle. See src/app/admin/masuk/.
 *
 * Carries only the publishable key, which is safe to ship: every table is
 * protected by Row Level Security, so the key alone grants nothing beyond what
 * an anonymous visitor may already read.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
