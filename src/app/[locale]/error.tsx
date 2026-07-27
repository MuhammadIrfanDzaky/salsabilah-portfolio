"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ui } from "@/data/profile";
import { isLocale, type Locale } from "@/lib/i18n";

/**
 * Batas kesalahan untuk seluruh rute publik berbahasa (competency 46).
 *
 * Rute blog membaca database; kalau Supabase tumbang atau kunci salah, tanpa
 * file ini pembaca mendapat layar putih. Di sini mereka mendapat kalimat dalam
 * bahasanya sendiri dan satu tombol yang benar-benar mencoba ulang.
 *
 * `useParams()` sengaja tidak dipakai — komponen ini bisa dirender ketika
 * segmen route-nya sendiri yang gagal. Locale dibaca dari `location.pathname`,
 * yang selalu ada di klien, dan jatuh ke bahasa Indonesia bila tidak terbaca.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const segment = typeof window === "undefined" ? "" : (window.location.pathname.split("/")[1] ?? "");
  const locale: Locale = isLocale(segment) ? segment : "id";

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="max-w-[54ch]">
        <p className="m-0 mb-4 flex items-center gap-3.5 font-mono text-[12.5px] uppercase tracking-[0.16em] text-accent-strong">
          <span aria-hidden="true" className="h-px w-9 flex-none bg-sand" />
          <span>{ui.error.kicker[locale]}</span>
        </p>

        <h1 className="m-0 mb-4 font-serif text-[clamp(27px,5vw,44px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink [text-wrap:balance]">
          {ui.error.title[locale]}
        </h1>

        <p className="m-0 mb-8 text-muted [text-wrap:pretty]">{ui.error.body[locale]}</p>

        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-accent-strong px-7 py-3 text-[15.5px] font-semibold text-on-accent transition-opacity hover:opacity-85"
          >
            {ui.error.retry[locale]}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center rounded-full border border-line px-7 py-3 text-[15.5px] font-semibold text-green no-underline transition-opacity hover:opacity-85 dark:text-sage"
          >
            {ui.error.backHome[locale]}
          </Link>
        </div>

        {/* Satu-satunya cara mencocokkan layar ini dengan baris log di Vercel. */}
        {error.digest ? (
          <p className="mt-8 font-mono text-[11px] tracking-[0.08em] text-muted">
            digest: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
