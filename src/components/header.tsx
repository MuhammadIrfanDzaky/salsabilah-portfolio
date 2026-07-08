"use client";

import Link from "next/link";
import { useState } from "react";
import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = ["about", "publications", "experience", "contact"] as const;

function SproutMark() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true" className="flex-none">
      <path d="M10 21 V5" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 13 C5.5 12 2.5 8.5 2 3.5 C7 4.5 9.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <path d="M10 13 C14.5 12 17.5 8.5 18 3.5 C13 4.5 10.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <circle cx="10" cy="2.6" r="1.3" fill="var(--sage)" />
    </svg>
  );
}

function LanguageSwitch({ locale }: { locale: Locale }) {
  const pill =
    "font-mono text-[12px] tracking-[0.08em] px-3 py-[5px] rounded-full transition-colors";
  return (
    <div
      role="group"
      aria-label={ui.languageLabel[locale]}
      className="inline-flex items-center gap-[2px] p-[3px] rounded-full border border-line bg-surface"
    >
      <Link
        href="/en"
        aria-current={locale === "en" ? "page" : undefined}
        aria-label={ui.switchToEnglish[locale]}
        className={`${pill} ${locale === "en" ? "bg-green text-on-green" : "text-muted hover:text-ink"}`}
      >
        EN
      </Link>
      <Link
        href="/id"
        aria-current={locale === "id" ? "page" : undefined}
        aria-label={ui.switchToIndonesian[locale]}
        className={`${pill} ${locale === "id" ? "bg-green text-on-green" : "text-muted hover:text-ink"}`}
      >
        ID
      </Link>
    </div>
  );
}

export function Header({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1160px] items-center justify-between gap-4 px-6">
        <a href="#hero" className="flex min-w-0 items-center gap-2.5 text-ink no-underline">
          <SproutMark />
          <span className="truncate font-serif text-[19px] font-semibold tracking-[0.01em]">
            {profile.displayName}
          </span>
        </a>

        <nav aria-label={ui.primaryNav[locale]} className="hidden items-center gap-7 md:flex">
          {sections.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="border-b-2 border-transparent py-1 text-[15px] font-medium text-nav-text transition-colors hover:border-accent hover:text-green dark:hover:text-sage"
            >
              {ui.nav[s][locale]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitch locale={locale} />
          <ThemeToggle label={ui.themeToggle[locale]} />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={ui.primaryNav[locale]}
            onClick={() => setOpen(!open)}
            className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-line bg-surface text-green md:hidden dark:text-sage"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4 L16 16 M16 4 L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M2 5 H18 M2 10 H18 M2 15 H18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={ui.primaryNav[locale]}
          className="flex flex-col border-t border-line bg-paper px-6 pb-5 pt-2 md:hidden"
        >
          {sections.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              onClick={() => setOpen(false)}
              className="border-b border-line py-3.5 text-[17px] font-medium text-ink no-underline last:border-b-0"
            >
              {ui.nav[s][locale]}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
