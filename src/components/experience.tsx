import { experience, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/section-heading";

export function Experience({ locale }: { locale: Locale }) {
  return (
    <section id="experience" className="border-t border-line bg-paper-exp">
      <div className="mx-auto max-w-[1160px] px-6 py-[clamp(32px,4vw,48px)]">
        <div className="mb-[clamp(28px,4vw,40px)]">
          <SectionHeading
            kicker={ui.experienceSection.kicker}
            title={ui.experienceSection.title}
            lead={ui.experienceSection.lead}
            locale={locale}
          />
        </div>
        <ol className="m-0 flex list-none flex-col gap-5 p-0">
          {experience.map((job, i) => (
            <li
              key={i}
              className="rounded-[18px] border border-line bg-surface p-[clamp(22px,3vw,30px)] shadow-soft"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="m-0 font-serif text-[21px] font-semibold leading-[1.3] text-ink [text-wrap:balance]">
                  {job.role[locale]}
                </h3>
                <span className="font-mono text-[12.5px] tracking-[0.06em] text-accent-strong">
                  {job.period[locale]}
                </span>
              </div>
              <div className="mt-1 text-[14.5px] font-medium text-sage">
                {job.organization[locale]}
              </div>
              <ul className="mb-0 mt-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-sand">
                {job.details.map((detail, j) => (
                  <li key={j} className="text-[15.5px] text-muted [text-wrap:pretty]">
                    {detail[locale]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
