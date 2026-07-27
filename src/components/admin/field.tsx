"use client";

import type { ReactNode } from "react";

/**
 * Satu isian formulir dengan label, petunjuk, dan pesan galat yang benar-benar
 * tertaut secara aksesibilitas (competency 10).
 *
 * `aria-describedby` menunjuk petunjuk DAN galat sekaligus, dan `aria-invalid`
 * hanya dipasang saat ada galat — pembaca layar mengumumkan keduanya tanpa
 * pengguna perlu menebak isian mana yang bermasalah.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
  }) => ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-[13px] font-semibold tracking-[0.02em] text-ink">
        {label}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}

      {hint ? (
        <p id={hintId} className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="m-0 mt-1.5 text-[12.5px] font-semibold text-accent-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  "w-full box-border rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-accent-strong focus:outline-none";
