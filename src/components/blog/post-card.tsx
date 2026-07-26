import Image from "next/image";
import Link from "next/link";
import { ui } from "@/data/profile";
import { coverUrl, formatPublishedAt, localized, type PostListItem } from "@/lib/blog";
import type { Locale } from "@/lib/i18n";

export function PostCard({
  post,
  locale,
  categoryName,
  priority = false,
}: {
  post: PostListItem;
  locale: Locale;
  categoryName?: string;
  priority?: boolean;
}) {
  const cover = coverUrl(post.cover_path);
  const title = localized(post, "title", locale);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft transition-transform duration-300 hover:-translate-y-0.5">
      <Link href={`/${locale}/blog/${post.slug}`} className="block no-underline">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper">
          {cover && (
            <Image
              src={cover}
              alt={localized(post, "cover_alt", locale) || title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] uppercase tracking-[0.1em]">
          {categoryName && <span className="text-accent-strong">{categoryName}</span>}
          <time dateTime={post.published_at ?? undefined} className="text-muted">
            {formatPublishedAt(post.published_at, locale)}
          </time>
        </div>

        <h3 className="m-0 font-serif text-[20px] font-semibold leading-[1.3] [text-wrap:balance]">
          <Link
            href={`/${locale}/blog/${post.slug}`}
            className="text-ink no-underline transition-colors hover:text-accent-strong"
          >
            {title}
          </Link>
        </h3>

        <p className="m-0 line-clamp-3 text-[15px] text-muted [text-wrap:pretty]">
          {localized(post, "excerpt", locale)}
        </p>

        <Link
          href={`/${locale}/blog/${post.slug}`}
          className="mt-auto pt-1 font-mono text-[12px] tracking-[0.06em] text-accent-strong no-underline hover:text-green dark:hover:text-sage"
          aria-label={`${ui.blog.readMore[locale]}: ${title}`}
        >
          {ui.blog.readMore[locale]} →
        </Link>
      </div>
    </article>
  );
}
