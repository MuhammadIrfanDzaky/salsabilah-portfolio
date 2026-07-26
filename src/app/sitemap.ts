import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";
import { getPostBySlug, listPublishedSlugs } from "@/lib/blog";
import { locales } from "@/lib/i18n";

// Regenerated hourly: a newly published article should be discoverable without
// waiting for a deploy.
export const revalidate = 3600;

/** Both locales of a URL point at each other, so search engines pair them. */
function languageAlternates(path: string) {
  return Object.fromEntries(
    locales.map((locale) => [locale, `${profile.siteUrl}/${locale}${path}`]),
  ) as Record<string, string>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${profile.siteUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: languageAlternates("") },
    });
  }

  const slugs = await listPublishedSlugs();

  // The blog index only belongs in the sitemap once it actually has content
  // (K7) — otherwise crawlers are pointed at a 404.
  if (slugs.length > 0) {
    for (const locale of locales) {
      entries.push({
        url: `${profile.siteUrl}/${locale}/blog`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: languageAlternates("/blog") },
      });
    }
  }

  const posts = await Promise.all(slugs.map((slug) => getPostBySlug(slug)));

  for (const post of posts) {
    if (!post) continue;
    for (const locale of locales) {
      entries.push({
        url: `${profile.siteUrl}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "yearly",
        priority: 0.7,
        alternates: { languages: languageAlternates(`/blog/${post.slug}`) },
      });
    }
  }

  return entries;
}
