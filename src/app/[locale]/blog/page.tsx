import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/blog/post-card";
import { profile, ui } from "@/data/profile";
import { hasPublishedPosts, listCategories, listPosts, localized } from "@/lib/blog";
import { isLocale, locales, type Locale } from "@/lib/i18n";

// Rebuilt at most once a minute: new and scheduled posts appear without a
// deploy, while readers still get a cached page.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";
  const title = `${ui.blog.title[locale]} — ${profile.displayName}`;

  return {
    title,
    description: ui.blog.lead[locale],
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { en: "/en/blog", id: "/id/blog" },
    },
    openGraph: {
      type: "website",
      title,
      description: ui.blog.lead[locale],
      url: `/${locale}/blog`,
      locale: locale === "id" ? "id_ID" : "en_US",
    },
  };
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // K7: no live articles means the blog does not exist yet, not even by URL.
  if (!(await hasPublishedPosts())) notFound();

  const { q, kategori } = await searchParams;
  const [categories, posts] = await Promise.all([
    listCategories(),
    listPosts({ locale, query: q, categorySlug: kategori }),
  ]);

  const categoryNameById = new Map(categories.map((c) => [c.id, localized(c, "name", locale)]));
  const filterBase = `/${locale}/blog`;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="fixed left-4 top-[-80px] z-[100] rounded-full bg-green px-4.5 py-2.5 text-sm font-semibold text-on-green no-underline transition-[top] focus:top-3.5"
      >
        {ui.skipToContent[locale]}
      </a>
      <Header locale={locale} showBlog />
      <div className="page-content flex flex-1 flex-col">
        <main id="main" className="flex-1 outline-none" tabIndex={-1}>
          <section className="border-b border-line bg-paper-pubs">
            <div className="mx-auto max-w-[1160px] px-6 py-[clamp(32px,4vw,48px)]">
              <p className="mb-4 flex items-center gap-3.5">
                <span className="h-px w-9 flex-none bg-sand" />
                <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-accent-strong">
                  {ui.blog.kicker[locale]}
                </span>
              </p>
              <h1 className="m-0 font-serif text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
                {ui.blog.title[locale]}
              </h1>
              <p className="mb-0 mt-3.5 max-w-[62ch] text-muted [text-wrap:pretty]">
                {ui.blog.lead[locale]}
              </p>

              {/* Plain GET form: search keeps working without JavaScript and the
                  result stays a shareable URL. */}
              <form action={filterBase} method="GET" className="mt-6 flex flex-wrap gap-2.5">
                {kategori && <input type="hidden" name="kategori" value={kategori} />}
                <label htmlFor="blog-search" className="sr-only">
                  {ui.blog.searchLabel[locale]}
                </label>
                <input
                  id="blog-search"
                  name="q"
                  type="search"
                  defaultValue={q ?? ""}
                  placeholder={ui.blog.searchPlaceholder[locale]}
                  className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-sage sm:max-w-[320px]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-accent-strong px-6 py-2.5 text-[15px] font-semibold text-on-accent transition-colors hover:bg-green hover:text-on-green"
                >
                  {ui.blog.searchSubmit[locale]}
                </button>
              </form>

              <nav aria-label={ui.blog.searchLabel[locale]} className="mt-4 flex flex-wrap gap-2">
                <FilterPill
                  href={q ? `${filterBase}?q=${encodeURIComponent(q)}` : filterBase}
                  active={!kategori}
                  label={ui.blog.allCategories[locale]}
                />
                {categories.map((category) => {
                  const search = new URLSearchParams({ kategori: category.slug });
                  if (q) search.set("q", q);
                  return (
                    <FilterPill
                      key={category.id}
                      href={`${filterBase}?${search.toString()}`}
                      active={kategori === category.slug}
                      label={localized(category, "name", locale)}
                    />
                  );
                })}
              </nav>
            </div>
          </section>

          <section className="bg-surface">
            <div className="mx-auto max-w-[1160px] px-6 py-[clamp(32px,4vw,48px)]">
              {posts.length === 0 ? (
                <p className="m-0 text-muted">
                  {q ? ui.blog.noResults[locale] : ui.blog.empty[locale]}
                </p>
              ) : (
                <>
                  <p className="mb-6 mt-0 font-mono text-[12px] uppercase tracking-[0.1em] text-muted">
                    {posts.length} {ui.blog.resultCount[locale]}
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post, i) => (
                      <PostCard
                        key={post.slug}
                        post={post}
                        locale={locale}
                        categoryName={categoryNameById.get(post.category_id)}
                        priority={i < 3}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
        <Footer locale={locale} onHome={false} showBlog />
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-4 py-1.5 text-[13.5px] font-medium no-underline transition-colors ${
        active
          ? "border-green bg-green text-on-green"
          : "border-line bg-surface text-muted hover:border-sage hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
