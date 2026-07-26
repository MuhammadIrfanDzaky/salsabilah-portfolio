import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import { profile, ui } from "@/data/profile";
import { isLocale, locales, type Locale } from "@/lib/i18n";

/**
 * The site's only 404.
 *
 * Next always resolves `notFound()` to the root boundary here — a nested
 * `[locale]/not-found.tsx` is never selected — so this one file covers both:
 *
 *   /id/apa-pun   → the reader already chose a language; answer in it.
 *   /apa-pun      → language unknown; say it twice and let them pick.
 *
 * Two things follow from rendering outside the locale layout, and both were
 * found by measuring rather than assuming:
 *
 *   1. `globals.css` does not apply here — Tailwind utilities silently produce
 *      nothing (`min-h-screen` computed to 0px) and the `@theme` tokens are
 *      absent from `:root`. So this page ships its own scoped stylesheet and
 *      uses no Tailwind class at all.
 *   2. next-themes never mounts, so dark mode comes from a media query rather
 *      than the `.dark` class.
 *
 * The language is read from the `x-pathname` header set in middleware, not
 * from `usePathname()`: on the client the first paint is always the wrong
 * language until hydration corrects it, and crawlers only see that first paint.
 */

const fraunces = Fraunces({ subsets: ["latin"], variable: "--nf-serif" });
const inter = Inter({ subsets: ["latin"], variable: "--nf-sans" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  preload: false,
  variable: "--nf-mono",
});

export const metadata: Metadata = {
  title: `404 — ${profile.displayName}`,
  robots: { index: false, follow: true },
};

const css = `
.nf-root {
  --paper: #faf7f0;
  --surface: #ffffff;
  --green: #2e4a38;
  --sage: #7e9a82;
  --sand: #d8c6a3;
  --ink: #20261e;
  --muted: #57604f;
  --accent: #b5643c;
  --accent-strong: #8f4b28;
  --on-accent: #fbf5e9;
  --line: rgba(46, 74, 56, 0.14);
  --hero-from: #f2ecdc;
  --hero-mid: #faf7f0;
  --hero-to: #efefe0;

  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background-color: var(--paper);
  color: var(--ink);
  font-family: var(--nf-sans), system-ui, sans-serif;
  font-size: 16.5px;
  line-height: 1.68;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  .nf-root {
    --paper: #141913;
    --surface: #1d241b;
    --green: #24382b;
    --sage: #8fae93;
    --sand: #c9b790;
    --ink: #eae6d9;
    --muted: #aab3a1;
    --accent: #d08b62;
    --accent-strong: #dd9d75;
    --on-accent: #2a1608;
    --line: rgba(201, 183, 144, 0.18);
    --hero-from: #1a2018;
    --hero-mid: #141913;
    --hero-to: #151c12;
  }
}

.nf-header {
  border-bottom: 1px solid var(--line);
}
.nf-header-inner {
  max-width: 1160px;
  margin: 0 auto;
  height: 68px;
  display: flex;
  align-items: center;
  padding: 0 24px;
}
.nf-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
  min-width: 0;
}
.nf-brand span {
  font-family: var(--nf-serif), Georgia, serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nf-main {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(180deg, var(--hero-from) 0%, var(--hero-mid) 55%, var(--hero-to) 100%);
}
.nf-field {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  width: 100%;
  height: 50%;
  pointer-events: none;
}
.nf-inner {
  position: relative;
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: clamp(40px, 8vw, 88px) 24px;
}
.nf-content {
  max-width: 54ch;
}

.nf-kicker {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 16px;
}
.nf-rule {
  width: 36px;
  height: 1px;
  flex: none;
  background: var(--sand);
}
.nf-kicker span {
  font-family: var(--nf-mono), ui-monospace, monospace;
  font-size: 12.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.nf-code {
  margin: 0;
  font-family: var(--nf-serif), Georgia, serif;
  font-size: clamp(58px, 13vw, 124px);
  font-weight: 600;
  line-height: 0.9;
  letter-spacing: -0.02em;
  color: color-mix(in oklab, var(--green) 28%, transparent);
}

.nf-title {
  margin: 8px 0 16px;
  font-family: var(--nf-serif), Georgia, serif;
  font-size: clamp(27px, 5vw, 46px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-wrap: balance;
}
.nf-title-dual {
  font-size: clamp(23px, 4.5vw, 38px);
  line-height: 1.15;
}

.nf-body {
  margin: 0 0 8px;
  font-size: 16.5px;
  color: var(--muted);
  text-wrap: pretty;
}
.nf-body:last-of-type {
  margin-bottom: 32px;
}

.nf-choose {
  margin: 0 0 14px;
  font-family: var(--nf-mono), ui-monospace, monospace;
  font-size: 11.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.nf-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 13px 28px;
  font-size: 15.5px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: opacity 0.2s ease;
}
.nf-btn:hover {
  opacity: 0.85;
}
.nf-btn-primary {
  background: var(--accent-strong);
  color: var(--on-accent);
}
.nf-btn-ghost {
  border-color: var(--line);
  color: var(--green);
}
@media (prefers-color-scheme: dark) {
  .nf-btn-ghost {
    color: var(--sage);
  }
}
.nf-btn code {
  font-family: var(--nf-mono), ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.nf-root :focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 3px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .nf-root * {
    transition: none !important;
  }
}
`;

function SproutMark() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M10 21 V5" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 13 C5.5 12 2.5 8.5 2 3.5 C7 4.5 9.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <path d="M10 13 C14.5 12 17.5 8.5 18 3.5 C13 4.5 10.5 8 10 13 Z" stroke="var(--green)" strokeWidth="1.2" fill="none" />
      <circle cx="10" cy="2.6" r="1.3" fill="var(--sage)" />
    </svg>
  );
}

function FieldLines() {
  return (
    <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden="true" className="nf-field">
      <path d="M0 300 C 240 250 520 265 780 310 C 1040 355 1260 340 1440 295 L1440 520 L0 520 Z" fill="var(--sand)" opacity="0.3" />
      <path d="M0 360 C 300 300 620 310 900 365 C 1140 412 1320 402 1440 366 L1440 520 L0 520 Z" fill="var(--sage)" opacity="0.26" />
      <path d="M0 430 C 340 370 720 382 1040 436 C 1230 466 1360 462 1440 440 L1440 520 L0 520 Z" fill="var(--green)" opacity="0.17" />
      <path d="M170 250 Q 470 140 880 214" stroke="var(--accent)" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
      <circle cx="170" cy="250" r="3" fill="var(--sage)" opacity="0.6" />
      <circle cx="880" cy="214" r="3" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}

export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const first = pathname.split("/")[1] ?? "";
  const locale: Locale | null = isLocale(first) ? first : null;

  return (
    <>
      <style>{css}</style>
      <div className={`nf-root ${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
        {/* A trimmed-down header: the real one carries a theme toggle and a
            language switch whose providers do not exist on this page. */}
        <header className="nf-header">
          <div className="nf-header-inner">
            <Link href={locale ? `/${locale}` : "/en"} className="nf-brand">
              <SproutMark />
              <span>{profile.displayName}</span>
            </Link>
          </div>
        </header>

        <main className="nf-main">
          <FieldLines />
          <div className="nf-inner">
            <div className="nf-content">
              <p className="nf-kicker">
                <span className="nf-rule" aria-hidden="true" />
                <span>
                  {locale
                    ? ui.notFound.kicker[locale]
                    : `${ui.notFound.kicker.id} · ${ui.notFound.kicker.en}`}
                </span>
              </p>

              <p className="nf-code">404</p>

              {locale ? (
                <>
                  <h1 className="nf-title">{ui.notFound.title[locale]}</h1>
                  <p className="nf-body">{ui.notFound.body[locale]}</p>
                  <div className="nf-actions">
                    <Link href={`/${locale}`} className="nf-btn nf-btn-primary">
                      {ui.notFound.backHome[locale]}
                    </Link>
                    <Link href={`/${locale}#contact`} className="nf-btn nf-btn-ghost">
                      {ui.notFound.goContact[locale]}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="nf-title nf-title-dual">
                    {ui.notFound.title.id} · {ui.notFound.title.en}
                  </h1>
                  <p className="nf-body">{ui.notFound.body.id}</p>
                  <p className="nf-body">{ui.notFound.body.en}</p>
                  <p className="nf-choose">
                    {ui.notFound.chooseLanguage.id} · {ui.notFound.chooseLanguage.en}
                  </p>
                  <div className="nf-actions">
                    {locales.map((code) => (
                      <Link key={code} href={`/${code}`} hrefLang={code} className="nf-btn nf-btn-primary">
                        <code>{code.toUpperCase()}</code>
                        {code === "id" ? "Buka dalam Bahasa Indonesia" : "Open in English"}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
