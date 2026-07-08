import Image from "next/image";
import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";

function FieldLines() {
  return (
    <svg
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <path d="M170 600 Q 470 462 880 556" stroke="var(--accent)" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      <path d="M560 585 Q 900 448 1290 542" stroke="var(--accent)" strokeWidth="1.2" opacity="0.26" strokeLinecap="round" />
      <circle cx="170" cy="600" r="3" fill="var(--sage)" opacity="0.6" />
      <circle cx="560" cy="585" r="3" fill="var(--sage)" opacity="0.5" />
      <circle cx="880" cy="556" r="3" fill="var(--accent)" opacity="0.5" />
      <circle cx="1290" cy="542" r="3" fill="var(--accent)" opacity="0.42" />
      <path d="M0 620 C 240 570 520 585 780 630 C 1040 675 1260 660 1440 615 L1440 860 L0 860 Z" fill="var(--sand)" opacity="0.32" />
      <path d="M0 648 C 240 598 520 613 780 658 C 1040 703 1260 688 1440 643" stroke="var(--sand)" opacity="0.25" strokeWidth="1" />
      <path d="M0 700 C 300 640 620 650 900 705 C 1140 752 1320 742 1440 706 L1440 860 L0 860 Z" fill="var(--sage)" opacity="0.26" />
      <path d="M0 726 C 300 666 620 676 900 731 C 1140 778 1320 768 1440 732" stroke="var(--green)" opacity="0.2" strokeWidth="1" />
      <path d="M0 790 C 340 730 720 742 1040 796 C 1230 826 1360 822 1440 800 L1440 860 L0 860 Z" fill="var(--green)" opacity="0.17" />
    </svg>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--hero-from) 0%, var(--hero-mid) 48%, var(--hero-to) 100%)",
      }}
    >
      <FieldLines />
      <div className="relative mx-auto max-w-[1160px] px-6 pb-[clamp(88px,10vw,124px)] pt-[clamp(48px,6vw,88px)]">
        <div className="grid items-center gap-[clamp(36px,6vw,80px)] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <div>
            <p className="mb-5 flex items-center gap-3.5">
              <span className="h-px w-9 flex-none bg-sand" />
              <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-accent-strong">
                {profile.kicker[locale]}
              </span>
            </p>
            <h1 className="mb-5 font-serif text-[clamp(42px,7vw,80px)] font-semibold leading-[1.03] tracking-[-0.015em] text-ink [text-wrap:balance]">
              {profile.displayName}
            </h1>
            <p className="mb-4 font-serif text-[clamp(19px,2.4vw,23px)] font-medium italic leading-[1.4] text-green dark:text-sage">
              {profile.role[locale]}
            </p>
            <p className="mb-8 max-w-[56ch] text-[17px] text-muted [text-wrap:pretty]">
              {profile.tagline[locale]}
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#publications"
                className="inline-flex items-center rounded-full bg-accent-strong px-7 py-3 text-[15.5px] font-semibold text-on-accent no-underline transition-colors hover:bg-green hover:text-on-green"
              >
                {ui.hero.cta1[locale]}
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-green/40 px-7 py-3 text-[15.5px] font-semibold text-green no-underline transition-colors hover:bg-sage/20 dark:border-sage/40 dark:text-sage"
              >
                {ui.hero.cta2[locale]}
              </a>
            </div>
          </div>
          <div className="relative min-w-0">
            <figure className="relative mx-auto my-0 aspect-[4/5] w-[min(360px,86%)] overflow-hidden rounded-[190px_190px_18px_18px] border border-sage/50 shadow-soft lg:ml-auto lg:mr-0">
              <Image
                src={profile.photo}
                alt={ui.hero.photoAlt[locale]}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 86vw, 360px"
                className="object-cover"
              />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
