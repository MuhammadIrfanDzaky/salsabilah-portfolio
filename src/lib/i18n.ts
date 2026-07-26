export const locales = ["en", "id"] as const;

export type Locale = (typeof locales)[number];

/** A string pair holding the English and Indonesian variants of one piece of content. */
export type Localized = {
  en: string;
  id: string;
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "id" : "en";
}

/**
 * Anchor target for a one-pager section.
 *
 * On the homepage this stays a bare fragment (`#about`) — Next.js sets
 * `history.scrollRestoration = "manual"`, and a path-qualified href on the
 * current page produces a same-document navigation that never scrolls. Away
 * from the homepage the locale prefix is required so the link resolves at all.
 */
export function sectionHref(locale: Locale, section: string, onHome: boolean): string {
  return onHome ? `#${section}` : `/${locale}#${section}`;
}
