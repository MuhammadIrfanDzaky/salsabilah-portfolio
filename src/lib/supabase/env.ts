/**
 * Fail loudly at startup rather than with a confusing runtime error later
 * (competency 29 — Env & Secrets).
 *
 * Only publishable values live here. The Supabase service-role key and the
 * translation provider key are deliberately absent: nothing in this module is
 * allowed to be a secret, because everything here reaches the browser.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
