import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";

const sections = ["about", "publications", "experience", "contact"] as const;

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-line-on-green bg-green-deep text-on-green">
      <div className="mx-auto max-w-[1160px] px-6 pb-[112px] pt-11 md:pb-9">
        <div className="mb-8 flex justify-center">
          <svg width="150" height="26" viewBox="0 0 150 26" fill="none" aria-hidden="true">
            <line x1="0" y1="13" x2="56" y2="13" stroke="var(--line-on-green)" strokeWidth="1" />
            <line x1="94" y1="13" x2="150" y2="13" stroke="var(--line-on-green)" strokeWidth="1" />
            <path d="M75 23 V5" stroke="var(--sand)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M75 14 C71 13 67.5 10 67 5.5 C71.5 6.5 74.5 9.5 75 14 Z" stroke="var(--sand)" strokeWidth="1.1" fill="none" />
            <path d="M75 14 C79 13 82.5 10 83 5.5 C78.5 6.5 75.5 9.5 75 14 Z" stroke="var(--sand)" strokeWidth="1.1" fill="none" />
            <circle cx="75" cy="3.6" r="1.4" fill="var(--sand)" />
          </svg>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="font-serif text-[18px] font-semibold text-on-green-strong">
              {profile.displayName}
            </div>
            <div className="mt-0.5 text-[13px] text-on-green-soft">{ui.footer.tag[locale]}</div>
          </div>
          <nav aria-label={ui.primaryNav[locale]} className="flex flex-wrap gap-5">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="text-[13.5px] text-on-green-soft no-underline hover:text-sand"
              >
                {ui.nav[s][locale]}
              </a>
            ))}
          </nav>
        </div>
        <p className="mb-0 mt-8 text-center font-mono text-[11.5px] tracking-[0.08em] text-on-green-soft">
          {ui.footer.rights[locale]}
        </p>
      </div>
    </footer>
  );
}
