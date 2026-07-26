import { profile, ui } from "@/data/profile";
import { listPosts, localized } from "@/lib/blog";
import { isLocale, locales, type Locale } from "@/lib/i18n";

export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * XML has five characters that cannot appear literally in text. Titles come
 * from the database, so they are escaped rather than trusted — an unescaped
 * ampersand alone is enough to make the whole feed unparseable.
 */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return new Response("Not found", { status: 404 });
  }
  const locale: Locale = raw;

  const posts = await listPosts({ locale, limit: 20 });
  const feedUrl = `${profile.siteUrl}/${locale}/feed.xml`;
  const channelTitle = `${ui.blog.title[locale]} — ${profile.displayName}`;

  const items = posts
    .map((post) => {
      const url = `${profile.siteUrl}/${locale}/blog/${post.slug}`;
      return `    <item>
      <title>${xmlEscape(localized(post, "title", locale))}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${post.published_at ? new Date(post.published_at).toUTCString() : ""}</pubDate>
      <description>${xmlEscape(localized(post, "excerpt", locale))}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(`${profile.siteUrl}/${locale}/blog`)}</link>
    <description>${xmlEscape(ui.blog.lead[locale])}</description>
    <language>${locale === "id" ? "id-ID" : "en-GB"}</language>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
