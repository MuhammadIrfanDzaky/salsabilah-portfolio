import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Publications } from "@/components/publications";
import { Experience } from "@/components/experience";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { ui } from "@/data/profile";
import { isLocale } from "@/lib/i18n";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="fixed left-4 top-[-80px] z-[100] rounded-full bg-green px-4.5 py-2.5 text-sm font-semibold text-on-green no-underline transition-[top] focus:top-3.5"
      >
        {ui.skipToContent[locale]}
      </a>
      <Header locale={locale} />
      <div className="page-content flex flex-1 flex-col">
        <main id="main" className="flex-1 outline-none" tabIndex={-1}>
          <Hero locale={locale} />
          <About locale={locale} />
          <Publications locale={locale} />
          <Experience locale={locale} />
          <Contact locale={locale} />
        </main>
        <Footer locale={locale} />
      </div>
    </div>
  );
}
