import type { Localized, Locale } from "@/lib/i18n";

export function SectionHeading({
  kicker,
  title,
  lead,
  locale,
  onGreen = false,
}: {
  kicker: Localized;
  title: Localized;
  lead?: Localized;
  locale: Locale;
  onGreen?: boolean;
}) {
  return (
    <div>
      <p className="mb-4 flex items-center gap-3.5">
        <span className="h-px w-9 flex-none bg-sand" />
        <span
          className={`font-mono text-[12.5px] uppercase tracking-[0.16em] ${
            onGreen ? "text-sand" : "text-accent-strong"
          }`}
        >
          {kicker[locale]}
        </span>
      </p>
      <h2
        className={`m-0 font-serif text-[clamp(30px,4vw,46px)] font-semibold leading-[1.08] tracking-[-0.01em] ${
          onGreen ? "text-on-green-strong" : "text-ink"
        }`}
      >
        {title[locale]}
      </h2>
      {lead && (
        <p
          className={`mb-0 mt-3.5 max-w-[62ch] ${
            onGreen ? "text-on-green-soft" : "text-muted"
          }`}
        >
          {lead[locale]}
        </p>
      )}
    </div>
  );
}
