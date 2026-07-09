"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = ["about", "publications", "experience", "contact"] as const;
type SectionId = (typeof sections)[number];

/* Fallback fade duration when the View Transitions API is unavailable (must
   match the .page-content transition duration in globals.css). */
const LEAVE_MS = 280;

/* Resolved by Header once the new locale's content has committed, letting the
   view transition finish its cross-fade against the fresh DOM. */
let resolveLocaleTransition: (() => void) | null = null;

function themeLabels(locale: Locale) {
  return {
    group: ui.themeLabel[locale],
    light: ui.themeLight[locale],
    dark: ui.themeDark[locale],
  };
}

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

function SectionIcon({ id }: { id: SectionId }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    "aria-hidden": true as const,
    className: "flex-none",
  };
  switch (id) {
    case "about":
      return (
        <svg {...common}>
          <circle cx="10" cy="6.6" r="3.1" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.8 16.8 C4.8 13.4 7.2 11.9 10 11.9 C12.8 11.9 15.2 13.4 16.2 16.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "publications":
      return (
        <svg {...common}>
          <rect x="4.5" y="2.8" width="11" height="14.4" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.4 7 H12.6 M7.4 10 H12.6 M7.4 13 H10.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "experience":
      return (
        <svg {...common}>
          <rect x="2.9" y="6.4" width="14.2" height="10.2" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.4 6.4 V5 A1.6 1.6 0 0 1 9 3.4 H11 A1.6 1.6 0 0 1 12.6 5 V6.4 M2.9 10.6 H17.1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <rect x="2.8" y="4.4" width="14.4" height="11.2" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.6 6 L10 10.8 L16.4 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function LanguageSwitch({ locale, onSwitch }: { locale: Locale; onSwitch?: () => void }) {
  const router = useRouter();
  const leaving = useRef(false);

  useEffect(() => {
    leaving.current = false;
  }, [locale]);

  const switchTo = (target: Locale) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (target === locale || leaving.current) return;
    onSwitch?.();
    // scroll: false keeps the reader exactly where they were on the page
    const navigate = () => router.push(`/${target}`, { scroll: false });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate();
      return;
    }
    leaving.current = true;
    if (typeof document.startViewTransition === "function") {
      // Same cross-fade as the theme switch. The update callback resolves once
      // the new locale's DOM has committed (signalled from Header's effect).
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolveLocaleTransition = resolve;
            navigate();
            // Never hold the frozen snapshot hostage if navigation stalls.
            window.setTimeout(() => {
              resolveLocaleTransition?.();
              resolveLocaleTransition = null;
            }, 1200);
          }),
      );
    } else {
      document.documentElement.classList.add("page-leaving");
      window.setTimeout(navigate, LEAVE_MS);
    }
  };

  const pill =
    "inline-flex h-7 items-center font-mono text-[12px] tracking-[0.08em] px-3 rounded-full transition-colors";
  return (
    <div
      role="group"
      aria-label={ui.languageLabel[locale]}
      className="inline-flex items-center gap-[2px] p-[3px] rounded-full border border-line bg-surface"
    >
      <Link
        href="/en"
        onClick={switchTo("en")}
        aria-current={locale === "en" ? "page" : undefined}
        aria-label={ui.switchToEnglish[locale]}
        className={`${pill} ${locale === "en" ? "bg-green text-on-green" : "text-muted hover:text-ink"}`}
      >
        EN
      </Link>
      <Link
        href="/id"
        onClick={switchTo("id")}
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
  const [active, setActive] = useState<SectionId | null>(null);
  const visibleSections = useRef<Set<string>>(new Set());

  // New locale content has committed: finish the language transition.
  useEffect(() => {
    resolveLocaleTransition?.();
    resolveLocaleTransition = null;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove("page-leaving")),
    );
    return () => cancelAnimationFrame(raf);
  }, [locale]);

  // Scroll spy: the section crossing the middle band of the viewport is active.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s))
      .filter((el): el is HTMLElement => el !== null);
    if (!("IntersectionObserver" in window) || els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSections.current.add(entry.target.id);
          else visibleSections.current.delete(entry.target.id);
        }
        setActive(sections.find((s) => visibleSections.current.has(s)) ?? null);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const snapshot = visibleSections.current;
    return () => {
      io.disconnect();
      snapshot.clear();
    };
  }, [locale]);

  /* Bottom-bar items: icon-only by default; the active one grows and reveals
     its label while the rest shrink (flex-grow + max-height are animated). */
  const barItem = (isActive: boolean) =>
    `relative flex h-[52px] basis-0 flex-col items-center justify-center gap-0.5 rounded-[13px] px-1 transition-[flex-grow,color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] active:scale-90 ${
      isActive ? "bg-sage/25 text-green dark:text-sage" : "text-muted"
    }`;
  const barLabel = (isActive: boolean) =>
    `overflow-hidden whitespace-nowrap text-[10px] font-semibold tracking-[0.02em] transition-[max-height,max-width,opacity] duration-300 ${
      isActive ? "max-h-4 max-w-32 opacity-100" : "max-h-0 max-w-0 opacity-0"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1160px] items-center justify-between gap-4 px-6">
          <a href="#hero" className="flex min-w-0 items-center gap-2.5 text-ink no-underline">
            <SproutMark />
            <span className="truncate font-serif text-[19px] font-semibold tracking-[0.01em]">
              {profile.displayName}
            </span>
          </a>

          <nav aria-label={ui.primaryNav[locale]} className="hidden items-center gap-7 lg:flex">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className={`border-b-2 py-1 text-[15px] font-medium transition-colors hover:border-accent hover:text-green dark:hover:text-sage ${
                  active === s
                    ? "border-accent text-green dark:text-sage"
                    : "border-transparent text-nav-text"
                }`}
              >
                {ui.nav[s][locale]}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitch locale={locale} />
            <ThemeToggle labels={themeLabels(locale)} />
          </div>
        </div>
      </header>

      <nav
        aria-label={ui.primaryNav[locale]}
        className="fixed inset-x-3.5 z-50 mx-auto max-w-[480px] lg:hidden"
        style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Settings panel — stays mounted so expand/collapse can animate. */}
        <div
          id="mobile-menu"
          className={`absolute inset-x-0 bottom-full mb-2 origin-bottom rounded-[18px] border border-line bg-paper p-2 shadow-soft transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
            open
              ? "visible translate-y-0 scale-100 opacity-100"
              : "pointer-events-none invisible translate-y-3 scale-[0.97] opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-[13px] font-semibold text-ink">{ui.languageLabel[locale]}</span>
            <LanguageSwitch locale={locale} onSwitch={() => setOpen(false)} />
          </div>
          <div className="mx-3 h-px bg-line" />
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-[13px] font-semibold text-ink">{ui.themeLabel[locale]}</span>
            <ThemeToggle labels={themeLabels(locale)} />
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-paper/85 p-1.5 shadow-soft backdrop-blur-xl">
          <div className="flex items-stretch">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={() => setOpen(false)}
                aria-current={active === s ? "true" : undefined}
                className={`${barItem(active === s)} no-underline`}
                style={{ flexGrow: active === s ? 2.4 : 1 }}
              >
                <SectionIcon id={s} />
                <span className={barLabel(active === s)}>{ui.nav[s][locale]}</span>
              </a>
            ))}
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={ui.menuLabel[locale]}
              onClick={() => setOpen(!open)}
              className={barItem(open)}
              style={{ flexGrow: open ? 2.4 : 1 }}
            >
              <span className="relative block h-5 w-5 flex-none">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`absolute inset-0 transition-[opacity,transform] duration-300 ${
                    open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                  }`}
                >
                  <path d="M3 5.5 H17 M3 10 H17 M3 14.5 H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`absolute inset-0 transition-[opacity,transform] duration-300 ${
                    open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                  }`}
                >
                  <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className={barLabel(open)}>{ui.menuLabel[locale]}</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
