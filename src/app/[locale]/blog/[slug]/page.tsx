import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostBody } from "@/components/blog/post-body";
import { PostDoc } from "@/components/blog/post-doc";
import { sanitizeDoc } from "@/lib/doc";
import { ArticleEngagement } from "@/components/blog/article-engagement";
import { CommentsSection } from "@/components/blog/comments-section";
import { profile, ui } from "@/data/profile";
import {
  coverUrl,
  formatPublishedAt,
  getPostBySlug,
  listCategories,
  localized,
  readingMinutes,
  resolveRenamedSlug,
} from "@/lib/blog";
import { isLocale, otherLocale, type Locale } from "@/lib/i18n";

export const revalidate = 60;

/**
 * Unknown slugs are rendered on demand rather than rejected at the routing
 * layer. Two things depend on it: the locale-aware 404, and the 301 for a
 * renamed slug — both live inside this component and never run if the router
 * refuses the request first.
 */
export const dynamicParams = true;

/*
 * `generateStaticParams` is deliberately ABSENT, and removing it fixed a real
 * failure (found 2026-07-27 by publishing the first article on a build made
 * when none existed).
 *
 * With it present but returning an empty list — the state of every build made
 * before the first article goes live — Next emits no fallback for this route,
 * and every on-demand request dies inside the router with
 * `Error: Internal: NoFallbackError` before the component runs. The visible
 * symptom is a 404. Two things break at once, both silently:
 *
 *   1. The first article Salsabilah publishes is unreachable until someone
 *      pushes a commit and triggers a rebuild — and publishing does not push.
 *   2. The 301 for a renamed slug never fires, because it lives in this
 *      component and the component is never reached.
 *
 * Once at least one slug is prerendered the problem disappears, which is
 * exactly what makes it easy to miss: it only bites the empty-blog state, and
 * that state is where this site starts.
 *
 * The cost is that post pages are rendered on demand rather than at build
 * time. `revalidate = 60` above still caches each URL after its first hit, so
 * what is actually lost is the very first render of each article, not every
 * render. Correctness on day one is worth more than that.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "en";
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = localized(post, "title", locale);
  const description = localized(post, "excerpt", locale);
  const cover = coverUrl(post.cover_path);

  return {
    title: `${title} — ${profile.displayName}`,
    description,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { en: `/en/blog/${slug}`, id: `/id/blog/${slug}` },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/${locale}/blog/${slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [profile.displayName],
      locale: locale === "id" ? "id_ID" : "en_US",
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const post = await getPostBySlug(slug);

  if (!post) {
    // A renamed slug keeps its old URL working with a real 301, so nothing
    // already shared or indexed breaks.
    const current = await resolveRenamedSlug(slug);
    if (current) permanentRedirect(`/${locale}/blog/${current}`);
    notFound();
  }

  const categories = await listCategories();
  const categoryName = categories.find((c) => c.id === post.category_id);

  const title = localized(post, "title", locale);
  const body = localized(post, "body", locale);
  const doc = sanitizeDoc(locale === "en" ? post.doc_en : post.doc_id);
  const cover = coverUrl(post.cover_path);
  const other = otherLocale(locale);

  // Article structured data — the bar competency 11 sets for content pages.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: localized(post, "excerpt", locale),
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: locale === "id" ? "id-ID" : "en-GB",
    author: { "@type": "Person", name: profile.displayName },
    image: cover ? [cover] : undefined,
  };

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
          <article className="bg-surface">
            <div className="mx-auto max-w-[760px] px-6 py-[clamp(28px,4vw,48px)]">
              <Link
                href={`/${locale}/blog`}
                className="font-mono text-[12px] tracking-[0.06em] text-accent-strong no-underline hover:text-green dark:hover:text-sage"
              >
                ← {ui.blog.backToBlog[locale]}
              </Link>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] uppercase tracking-[0.1em]">
                {categoryName && (
                  <span className="text-accent-strong">{localized(categoryName, "name", locale)}</span>
                )}
                <time dateTime={post.published_at ?? undefined} className="text-muted">
                  {formatPublishedAt(post.published_at, locale)}
                </time>
                <span className="text-muted">
                  {readingMinutes(body)} {ui.blog.minuteRead[locale]}
                </span>
              </div>

              <h1 className="mb-4 mt-3 font-serif text-[clamp(28px,5vw,44px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink [text-wrap:balance]">
                {title}
              </h1>

              <p className="mb-6 mt-0 text-[17.5px] text-muted [text-wrap:pretty]">
                {localized(post, "excerpt", locale)}
              </p>

              {/* Both languages always exist — the publish constraint enforces
                  it — so this link can never lead to a missing translation. */}
              <Link
                href={`/${other}/blog/${slug}`}
                hrefLang={other}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-muted no-underline transition-colors hover:border-sage hover:text-ink"
              >
                {ui.blog.readInOther[locale]}
              </Link>

              {cover && (
                <figure className="my-8">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[18px] border border-line">
                    <Image
                      src={cover}
                      alt={localized(post, "cover_alt", locale) || title}
                      fill
                      priority
                      sizes="(max-width: 800px) 100vw, 760px"
                      className="object-cover"
                    />
                  </div>
                </figure>
              )}

              {/* Dokumen adalah sumber kebenaran; `body` hanya cerminnya.
                  Cadangan teks polos dipertahankan supaya artikel tetap
                  terbaca seandainya dokumennya kosong karena sebab apa pun —
                  isi yang hilang jauh lebih buruk daripada isi tanpa format. */}
              {doc.content.length > 0 ? (
                <PostDoc doc={doc} locale={locale} />
              ) : (
                <PostBody body={body} />
              )}

              <hr className="my-10 border-0 border-t border-line" />

              <ArticleEngagement
                postId={post.id}
                locale={locale}
                initialCount={post.like_count}
                url={`${profile.siteUrl}/${locale}/blog/${slug}`}
                title={title}
              />

              <CommentsSection postId={post.id} locale={locale} articleTitle={title} />

              <hr className="my-10 border-0 border-t border-line" />

              <Link
                href={`/${locale}/blog`}
                className="font-mono text-[12px] tracking-[0.06em] text-accent-strong no-underline hover:text-green dark:hover:text-sage"
              >
                ← {ui.blog.backToBlog[locale]}
              </Link>
            </div>
          </article>
        </main>
        <Footer locale={locale} onHome={false} showBlog />
      </div>

      <script
        type="application/ld+json"
        // Serialised by us from typed database values, never from reader input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
