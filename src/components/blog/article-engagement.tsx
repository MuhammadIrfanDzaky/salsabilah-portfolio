"use client";

import { useActionState, useEffect, useState } from "react";
import { hasLiked, toggleLike } from "@/app/[locale]/blog/[slug]/actions";
import { ui } from "@/data/profile";
import { visitorId } from "@/lib/visitor";
import type { Locale } from "@/lib/i18n";

/**
 * Tombol "bermanfaat" dan berbagi (K3).
 *
 * Keduanya di klien karena keduanya bergantung pada keadaan yang hanya ada di
 * peramban: penanda pengunjung di localStorage, dan Web Share API. Halaman
 * artikelnya sendiri tetap bisa di-cache karena tidak ikut berubah.
 */

const pill =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors disabled:opacity-60";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true" fill={filled ? "currentColor" : "none"}>
      <path
        d="M10 16.5C10 16.5 2.8 12.3 2.8 7.6A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 7.2 1.6c0 4.7-7.2 8.9-7.2 8.9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArticleEngagement({
  postId,
  locale,
  initialCount,
  url,
  title,
}: {
  postId: string;
  locale: Locale;
  initialCount: number;
  url: string;
  title: string;
}) {
  const [visitor, setVisitor] = useState("");
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(toggleLike, null);

  useEffect(() => {
    const id = visitorId();
    setVisitor(id);

    // Tombol harus tampil dalam keadaan yang benar saat halaman dibuka.
    // Lewat fungsi `has_liked`, bukan SELECT ke tabel likes: membaca baris
    // likes berarti bisa mendaftar penanda pengunjung lain, jadi hak bacanya
    // sudah dicabut di migrasi 0006.
    void hasLiked(postId, id).then(setLiked);
  }, [postId]);

  useEffect(() => {
    if (!state?.ok) return;
    setLiked(state.liked);
    setCount((n) => Math.max(0, n + (state.liked ? 1 : -1)));
  }, [state]);

  async function share() {
    const data = { title, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // Dibatalkan pengguna — jatuh ke salin tautan.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={formAction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="visitor" value={visitor} />
        <button
          type="submit"
          disabled={pending || visitor === ""}
          aria-pressed={liked}
          className={`${pill} ${
            liked
              ? "border-accent-strong bg-accent/10 text-accent-strong"
              : "border-line text-muted hover:border-sage hover:text-ink"
          }`}
        >
          <HeartIcon filled={liked} />
          <span>{liked ? ui.engagement.liked[locale] : ui.engagement.like[locale]}</span>
          {count > 0 ? <span className="opacity-70">{count}</span> : null}
        </button>
      </form>

      <button
        type="button"
        onClick={share}
        className={`${pill} border-line text-muted hover:border-sage hover:text-ink`}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 12v3.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span>{copied ? ui.engagement.copied[locale] : ui.engagement.share[locale]}</span>
      </button>

      {/* Diumumkan terpisah supaya pembaca layar tahu penyalinan berhasil,
          tanpa memindahkan fokus dari tombolnya. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? ui.engagement.copied[locale] : ""}
      </span>
    </div>
  );
}
