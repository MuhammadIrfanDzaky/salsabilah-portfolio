"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

type ThemeLabels = {
  group: string;
  light: string;
  dark: string;
};

/* Segmented light/dark control, styled identically to the language switch. */
export function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const applyTheme = (next: "light" | "dark") => {
    if (mounted && next === (isDark ? "dark" : "light")) return;
    const apply = () => setTheme(next);
    // Cross-fade the whole page between themes where the browser supports it.
    if (
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  };

  const pill =
    "inline-flex h-7 items-center justify-center px-3 rounded-full transition-colors cursor-pointer";

  return (
    <div
      role="group"
      aria-label={labels.group}
      className="inline-flex items-center gap-[2px] rounded-full border border-line bg-surface p-[3px]"
    >
      <button
        type="button"
        aria-label={labels.light}
        aria-pressed={mounted ? !isDark : undefined}
        onClick={() => applyTheme("light")}
        className={`${pill} ${mounted && !isDark ? "bg-green text-on-green" : "text-muted hover:text-ink"}`}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.5 V3.5 M10 16.5 V18.5 M1.5 10 H3.5 M16.5 10 H18.5 M4 4 L5.4 5.4 M14.6 14.6 L16 16 M16 4 L14.6 5.4 M5.4 14.6 L4 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label={labels.dark}
        aria-pressed={mounted ? isDark : undefined}
        onClick={() => applyTheme("dark")}
        className={`${pill} ${isDark ? "bg-green text-on-green" : "text-muted hover:text-ink"}`}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M17 12.5 A7.5 7.5 0 0 1 7.5 3 A7.5 7.5 0 1 0 17 12.5 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
