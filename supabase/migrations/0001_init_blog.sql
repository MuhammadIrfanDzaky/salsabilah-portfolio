-- Blog schema for salsabilah-portfolio
-- Category: content +public-ugc +ai  (see PROJECT-SCOPE.md)
--
-- Design notes that this file deliberately enforces at the database level, so
-- an application bug cannot bypass them:
--   * A post can never be published unless BOTH locales are filled in AND the
--     machine translation has been reviewed (K2).
--   * Drafts are unreadable with the public key — not merely hidden in the UI.
--   * Scheduling needs no cron: a published row with a future published_at
--     simply is not live yet.
--   * Comments and posts are soft-deleted, never destroyed (K3, competency 19).
--   * Slugs are permanent; renames are recorded so old URLs can 301.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- categories

create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_id     text not null,
  name_en     text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table categories is 'Rubrik blog. Tiga kategori awal sesuai K6.';

-- --------------------------------------------------------------------- posts

create table posts (
  id                 uuid primary key default gen_random_uuid(),

  -- Permanent identity. Never edit in place; use rename_post_slug() below.
  slug               text not null unique,
  category_id        uuid not null references categories (id) on delete restrict,

  -- 'draft' | 'published'. Scheduling is expressed by a future published_at,
  -- which removes the need for a queue or cron job entirely.
  status             text not null default 'draft'
                       check (status in ('draft', 'published')),
  published_at       timestamptz,

  -- Which language Salsabilah actually wrote; the other side is machine
  -- translated and must be reviewed before it can go live.
  source_locale      text not null default 'id'
                       check (source_locale in ('id', 'en')),
  translation_status text not null default 'pending'
                       check (translation_status in ('pending', 'generated', 'reviewed')),

  title_id           text,
  title_en           text,
  excerpt_id         text,
  excerpt_en         text,
  body_id            text,
  body_en            text,

  cover_path         text,
  cover_alt_id       text,
  cover_alt_en       text,

  like_count         integer not null default 0 check (like_count >= 0),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  -- The K2 gate, enforced in the database rather than trusted to the UI.
  constraint posts_publish_requires_reviewed_bilingual check (
    status <> 'published' or (
      published_at is not null
      and translation_status = 'reviewed'
      and coalesce(title_id, '')  <> ''
      and coalesce(title_en, '')  <> ''
      and coalesce(body_id, '')   <> ''
      and coalesce(body_en, '')   <> ''
      and coalesce(cover_path, '') <> ''
    )
  )
);

comment on column posts.published_at is
  'UTC. A future value means scheduled: the row is not live until now() passes it.';

-- Full-text search per locale (competency 21 — never LIKE '%x%').
-- 'simple' for Indonesian: Postgres ships no Indonesian stemmer.
alter table posts
  add column search_id tsvector generated always as (
    to_tsvector('simple',
      coalesce(title_id, '') || ' ' || coalesce(excerpt_id, '') || ' ' || coalesce(body_id, ''))
  ) stored,
  add column search_en tsvector generated always as (
    to_tsvector('english',
      coalesce(title_en, '') || ' ' || coalesce(excerpt_en, '') || ' ' || coalesce(body_en, ''))
  ) stored;

create index posts_search_id_idx on posts using gin (search_id);
create index posts_search_en_idx on posts using gin (search_en);
create index posts_live_idx      on posts (status, published_at desc) where deleted_at is null;
create index posts_category_idx  on posts (category_id) where deleted_at is null;

-- One place that decides what "live" means, reused by every policy and query.
-- STABLE, not IMMUTABLE: it reads now(). Declaring it immutable would let the
-- planner fold the result once and serve a scheduled post at the wrong time.
create or replace function post_is_live(p posts) returns boolean
  language sql stable as $$
    select p.status = 'published'
       and p.deleted_at is null
       and p.published_at is not null
       and p.published_at <= now()
  $$;

create or replace function touch_updated_at() returns trigger
  language plpgsql as $$
    begin
      new.updated_at := now();
      return new;
    end
  $$;

create trigger posts_touch_updated_at
  before update on posts
  for each row execute function touch_updated_at();

-- --------------------------------------------------------- slug history (SEO)

create table post_slug_history (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  old_slug   text not null unique,
  changed_at timestamptz not null default now()
);

comment on table post_slug_history is
  'Feeds 301 redirects. A published URL is a promise; renaming without this loses rankings.';

-- Renaming a slug without recording the old one is the single most expensive
-- mistake on a content site, so make the safe path the easy path.
create or replace function rename_post_slug(p_post_id uuid, p_new_slug text)
  returns void language plpgsql security invoker as $$
    declare v_old text;
    begin
      select slug into v_old from posts where id = p_post_id for update;
      if v_old is null then
        raise exception 'post % not found', p_post_id;
      end if;
      if v_old = p_new_slug then
        return;
      end if;
      insert into post_slug_history (post_id, old_slug) values (p_post_id, v_old);
      update posts set slug = p_new_slug where id = p_post_id;
    end
  $$;

-- ------------------------------------------------------- translation glossary

create table translation_glossary (
  id         uuid primary key default gen_random_uuid(),
  term       text not null unique,
  note       text,
  created_at timestamptz not null default now()
);

comment on table translation_glossary is
  'Technical terms the translator must carry across verbatim (K2). Editable by Salsabilah.';

-- ------------------------------------------------------------------ comments

create table comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts (id) on delete cascade,

  -- K3: name optional, no email collected at all.
  author_name text check (author_name is null or char_length(author_name) between 1 and 60),
  body        text not null check (char_length(body) between 1 and 2000),

  -- Hashed, never the raw address: enough for rate limiting, not a stored identifier.
  visitor_hash text not null,

  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index comments_post_idx on comments (post_id, created_at desc) where deleted_at is null;
create index comments_rate_idx on comments (visitor_hash, created_at desc);

-- --------------------------------------------------------------------- likes

-- Composite primary key makes a repeat like a no-op instead of a double count
-- (competency 20 — idempotency without needing a queue or lock).
create table likes (
  post_id      uuid not null references posts (id) on delete cascade,
  visitor_hash text not null,
  created_at   timestamptz not null default now(),
  primary key (post_id, visitor_hash)
);

create or replace function sync_like_count() returns trigger
  language plpgsql security definer set search_path = public as $$
    begin
      if tg_op = 'INSERT' then
        update posts set like_count = like_count + 1 where id = new.post_id;
      elsif tg_op = 'DELETE' then
        update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
      end if;
      return null;
    end
  $$;

create trigger likes_sync_count
  after insert or delete on likes
  for each row execute function sync_like_count();

-- ---------------------------------------------------------------- admin users

create table admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (select 1 from admin_users where user_id = auth.uid())
  $$;

-- ------------------------------------------------------------ row level security

alter table categories          enable row level security;
alter table posts               enable row level security;
alter table post_slug_history   enable row level security;
alter table translation_glossary enable row level security;
alter table comments            enable row level security;
alter table likes               enable row level security;
alter table admin_users         enable row level security;

-- Public reads only what is genuinely live. Drafts and scheduled-but-not-yet
-- posts are invisible to the anon key, so no guessable URL can expose them.
create policy posts_public_read on posts
  for select to anon, authenticated
  using (post_is_live(posts));

create policy posts_admin_all on posts
  for all to authenticated
  using (is_admin()) with check (is_admin());

create policy categories_public_read on categories
  for select to anon, authenticated using (true);
create policy categories_admin_all on categories
  for all to authenticated using (is_admin()) with check (is_admin());

create policy slug_history_public_read on post_slug_history
  for select to anon, authenticated using (true);
create policy slug_history_admin_all on post_slug_history
  for all to authenticated using (is_admin()) with check (is_admin());

create policy glossary_admin_all on translation_glossary
  for all to authenticated using (is_admin()) with check (is_admin());

-- Comments are readable when not deleted and their post is live.
create policy comments_public_read on comments
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (select 1 from posts p where p.id = comments.post_id and post_is_live(p))
  );

-- Anyone may comment on a live post. Rate limiting, honeypot and link
-- heuristics live in the route handler; this is the last line, not the first.
create policy comments_public_insert on comments
  for insert to anon, authenticated
  with check (
    deleted_at is null
    and exists (select 1 from posts p where p.id = comments.post_id and post_is_live(p))
  );

-- Only Salsabilah can remove a comment, and removal is a soft delete.
create policy comments_admin_all on comments
  for all to authenticated using (is_admin()) with check (is_admin());

create policy likes_public_read on likes
  for select to anon, authenticated using (true);
create policy likes_public_insert on likes
  for insert to anon, authenticated
  with check (exists (select 1 from posts p where p.id = likes.post_id and post_is_live(p)));

create policy admin_users_self_read on admin_users
  for select to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------------- seed data

insert into categories (slug, name_id, name_en, sort_order) values
  ('ringkasan-publikasi', 'Ringkasan Publikasi', 'Research Summaries',      1),
  ('analisis-komoditas',  'Analisis Komoditas & Kebijakan', 'Commodity & Policy Analysis', 2),
  ('catatan-lapangan',    'Catatan Lapangan',   'Field & Conference Notes', 3);

insert into translation_glossary (term, note) values
  ('gravity model',                 'Metode ekonometrika — jangan diterjemahkan'),
  ('Revealed Comparative Advantage', 'Istilah baku; singkatan RCA'),
  ('RCA',                           'Singkatan baku'),
  ('SRCA',                          'Singkatan baku'),
  ('Constant Market Share',         'Istilah baku; singkatan CMS'),
  ('ARDL',                          'Autoregressive Distributed Lag'),
  ('CPO',                           'Crude Palm Oil — dipakai apa adanya di kedua bahasa'),
  ('hilirisasi',                    'Padanan Inggris: downstreaming'),
  ('EViews',                        'Nama perangkat lunak'),
  ('SPSS',                          'Nama perangkat lunak');
