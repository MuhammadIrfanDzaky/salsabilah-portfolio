import { profile, publications, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/section-heading";

export function Publications({ locale }: { locale: Locale }) {
  return (
    <section id="publications" className="border-t border-line bg-paper-pubs">
      <div className="mx-auto max-w-[1160px] px-6 py-[clamp(52px,6vw,72px)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            kicker={ui.publications.kicker}
            title={ui.publications.title}
            lead={ui.publications.lead}
            locale={locale}
          />
          <a
            href={profile.cvPath}
            download
            className="inline-flex items-center gap-2.5 rounded-full bg-accent-strong px-6 py-3 text-[15px] font-semibold text-on-accent no-underline transition-colors hover:bg-green hover:text-on-green"
          >
            <span>{ui.publications.downloadCv[locale]}</span>
            <span aria-hidden="true" className="font-mono">
              ↓
            </span>
          </a>
        </div>

        <ol className="m-0 mt-[clamp(28px,4vw,40px)] flex list-none flex-col p-0">
          {publications.map((pub, i) => (
            <li
              key={i}
              className="-mx-4 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-[14px] border-b border-line p-4 transition-colors hover:bg-surface"
            >
              <span className="min-w-12 font-mono text-[13px] text-accent-strong">{pub.year}</span>
              <div className="min-w-[min(100%,260px)] flex-1">
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-[19px] font-medium leading-[1.35] text-ink no-underline hover:text-accent-strong"
                >
                  {pub.title[locale]}
                </a>
                <div className="mt-1 text-[14px] text-muted">
                  <em>{pub.venue[locale]}</em>
                </div>
                <div className="mt-0.5 text-[13px] text-muted">{pub.authors}</div>
              </div>
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap font-mono text-[12px] tracking-[0.06em] text-accent-strong no-underline hover:text-green dark:hover:text-sage"
              >
                {ui.publications.view[locale]} ↗
              </a>
            </li>
          ))}
        </ol>

        <figure className="m-0 mt-[clamp(32px,4vw,48px)] overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft">
          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <span className="font-serif text-[18px] font-semibold text-ink">
              {ui.publications.cvPreviewTitle[locale]}
            </span>
            <span className="text-[13.5px] text-muted">{ui.publications.cvPreviewNote[locale]}</span>
          </figcaption>
          <iframe
            src={profile.cvPath}
            loading="lazy"
            title={ui.publications.cvPreviewTitle[locale]}
            className="block h-[560px] w-full border-0"
          />
          <p className="m-0 border-t border-line px-5 py-3 text-[13.5px] text-muted">
            {ui.publications.cvFallback[locale]}{" "}
            <a href={profile.cvPath} download className="text-accent-strong underline">
              {ui.publications.downloadCv[locale]}
            </a>
          </p>
        </figure>
      </div>
    </section>
  );
}
