import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

/**
 * Client for public, unauthenticated reads.
 *
 * Deliberately cookie-free: touching `cookies()` opts a route into dynamic
 * rendering, which would cost the blog its static/ISR generation. Row Level
 * Security still applies, so this can only ever see genuinely live posts.
 */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      /*
       * Tie the data cache to the same window the routes revalidate on.
       *
       * Left at the default, Next caches these fetches indefinitely: a page
       * with `revalidate = 60` would regenerate on schedule yet re-read the
       * identical stale response, so publishing an article would never reach
       * the homepage. `no-store` fixes freshness but makes every route dynamic
       * and breaks static generation outright — this keeps both.
       */
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }),
    },
  });
}

/**
 * Client bound to the visitor's session — use only where the signed-in
 * identity matters (the admin dashboard and its actions). Every query still
 * passes through RLS; the session only decides which policies match.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Session refresh happens in
          // middleware instead, so this is safe to swallow.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null. Uses getUser() rather than getSession():
 * getSession() trusts the cookie as-is, while getUser() revalidates it against
 * the auth server — the difference matters for an authorization decision.
 */
export async function getCurrentUser() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** True only if the signed-in user is listed in `admin_users`. */
export async function isCurrentUserAdmin() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}
