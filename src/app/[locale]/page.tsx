import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Publications } from "@/components/publications";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";
import { LatestPosts } from "@/components/blog/latest-posts";
import { Footer } from "@/components/footer";
import { ui } from "@/data/profile";
import { hasPublishedPosts } from "@/lib/blog";
import { isLocale } from "@/lib/i18n";

// K7: the blog entry point only appears once something is actually published,
// so the nav is re-checked periodically rather than frozen at build time.
export const revalidate = 60;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const showBlog = await hasPublishedPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="fixed left-4 top-[-80px] z-[100] rounded-full bg-green px-4.5 py-2.5 text-sm font-semibold text-on-green no-underline transition-[top] focus:top-3.5"
      >
        {ui.skipToContent[locale]}
      </a>
      <Header locale={locale} showBlog={showBlog} />
      <div className="page-content flex flex-1 flex-col">
        <main id="main" className="flex-1 outline-none" tabIndex={-1}>
          <Hero locale={locale} />
          <About locale={locale} />
          <Publications locale={locale} />
          <Experience locale={locale} />
          <LatestPosts locale={locale} />
          <Contact locale={locale} />
        </main>
        <Footer locale={locale} showBlog={showBlog} />
      </div>
    </div>
  );
}
