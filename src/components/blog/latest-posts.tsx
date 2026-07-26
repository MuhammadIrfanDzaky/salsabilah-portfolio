import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { SectionHeading } from "@/components/section-heading";
import { ui } from "@/data/profile";
import { listCategories, listPosts, localized } from "@/lib/blog";
import type { Locale } from "@/lib/i18n";

/**
 * Homepage teaser. Renders nothing at all when there is no published article,
 * which is the same K7 rule the nav follows — a visitor should never meet an
 * empty "Recent writing" heading.
 */
export async function LatestPosts({ locale }: { locale: Locale }) {
  const posts = await listPosts({ locale, limit: 3 });
  if (posts.length === 0) return null;

  const categories = await listCategories();
  const categoryNameById = new Map(categories.map((c) => [c.id, localized(c, "name", locale)]));

  return (
    <section id="writing" className="border-t border-line bg-paper-pubs">
      <div className="mx-auto max-w-[1160px] px-6 py-[clamp(32px,4vw,48px)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            kicker={ui.blog.latestKicker}
            title={ui.blog.latestTitle}
            lead={ui.blog.latestLead}
            locale={locale}
          />
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 rounded-full border border-green/40 px-5 py-2.5 text-[14.5px] font-semibold text-green no-underline transition-colors hover:bg-sage/20 dark:border-sage/40 dark:text-sage"
          >
            {ui.blog.viewAll[locale]} →
          </Link>
        </div>

        <div className="mt-[clamp(24px,3vw,36px)] grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.slug}
              post={post}
              locale={locale}
              categoryName={categoryNameById.get(post.category_id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
