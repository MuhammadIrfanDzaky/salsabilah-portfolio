-- Hardening pass in response to the Supabase security linter (competencies 26 & 27).
--
-- Two classes of finding:
--   1. function_search_path_mutable — a function without a pinned search_path can
--      be tricked into resolving an object from an attacker-controlled schema.
--   2. *_security_definer_function_executable — SECURITY DEFINER functions were
--      reachable over /rest/v1/rpc. None of them is meant to be called that way.

-- 1. Pin search_path on every function that lacked one.
alter function post_is_live(posts)            set search_path = public;
alter function touch_updated_at()             set search_path = public;
alter function rename_post_slug(uuid, text)   set search_path = public;

-- 2. Trim the RPC surface to exactly who needs it.

-- Trigger function: fires as part of INSERT/DELETE on likes and never needs an
-- EXECUTE grant for the invoking role. Nobody should be able to call it directly.
revoke all on function sync_like_count() from public, anon, authenticated;

-- Used inside RLS policies, which are evaluated with the *querying* role's
-- privileges — so `authenticated` must keep EXECUTE or admin policies break.
-- `anon` never hits a policy that references it.
revoke all on function is_admin() from public, anon;
grant execute on function is_admin() to authenticated;

-- Admin-only maintenance helper.
revoke all on function rename_post_slug(uuid, text) from public, anon;
grant execute on function rename_post_slug(uuid, text) to authenticated;

-- post_is_live() deliberately keeps its public grant: the anonymous read policy
-- on posts and comments calls it, and it discloses nothing beyond whether a row
-- the caller already supplied is live.
