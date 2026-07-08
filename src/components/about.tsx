import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/section-heading";

export function About({ locale }: { locale: Locale }) {
  return (
    <section id="about" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1160px] px-6 py-[clamp(52px,6vw,72px)]">
        <div className="mb-[clamp(26px,3.5vw,38px)]">
          <SectionHeading kicker={ui.about.kicker} title={ui.about.title} locale={locale} />
        </div>
        <div className="grid items-start gap-[clamp(36px,5vw,72px)] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4.5">
            {profile.bio.map((paragraph, i) => (
              <p key={i} className="m-0 [text-wrap:pretty]">
                {paragraph[locale]}
              </p>
            ))}
            <div className="mt-6 grid grid-cols-3 gap-[clamp(14px,3vw,36px)]">
              {profile.stats.map((stat, i) => (
                <div key={i} className="border-t border-sand pt-3.5">
                  <div className="font-mono text-[clamp(25px,3.4vw,38px)] font-medium leading-[1.1] text-green dark:text-sage">
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-[13.5px] leading-[1.45] text-muted">
                    {stat.label[locale]}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-[18px] border border-line bg-paper p-[clamp(24px,3vw,32px)] shadow-soft">
            <h3 className="mb-5 mt-0 font-mono text-[12.5px] font-medium uppercase tracking-[0.16em] text-sage">
              {ui.about.factsTitle[locale]}
            </h3>
            <dl className="m-0 flex flex-col gap-4.5">
              {profile.facts.map((fact, i) => (
                <div key={i}>
                  <dt className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                    {fact.label[locale]}
                  </dt>
                  <dd className="m-0 text-[15.5px] font-medium">{fact.value[locale]}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
