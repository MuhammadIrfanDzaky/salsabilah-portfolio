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
