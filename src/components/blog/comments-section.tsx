"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  listComments,
  submitComment,
  type Comment,
  type CommentResult,
} from "@/app/[locale]/blog/[slug]/actions";
import { profile, ui } from "@/data/profile";
import { visitorId } from "@/lib/visitor";
import type { Locale } from "@/lib/i18n";

/**
 * Komentar pembaca (K3: nama opsional, tanpa email, tanpa antrean moderasi).
 *
 * Daftarnya dimuat di klien, bukan ikut dirender di server. Dua alasan, dan
 * keduanya disengaja:
 *
 *   1. Konten dari publik tidak ikut masuk HTML yang diindeks mesin pencari.
 *      Tanpa pra-moderasi, merender komentar di server berarti spam yang
 *      belum sempat dihapus ikut menumpang peringkat halaman ini.
 *   2. Halaman artikelnya tetap bisa di-cache. Kalau komentar dibaca di
 *      server, pembaca baru melihat komentarnya sendiri setelah jendela
 *      revalidate lewat — terasa seperti gagal terkirim.
 *
 * Konsekuensinya komentar butuh JavaScript. Itu diterima untuk fitur yang
 * memang interaktif; artikelnya sendiri tetap terbaca penuh tanpa JavaScript.
 *
 * Isi komentar dirender sebagai teks di dalam elemen React — tidak pernah
 * lewat `dangerouslySetInnerHTML`, sehingga stored XSS tertutup di akarnya.
 */

const inputClasses =
  "w-full box-border rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-accent-strong focus:outline-none";

function formatWaktu(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function SubmitButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-full bg-accent-strong px-6 py-2.5 text-[14.5px] font-semibold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-60"
    >
      {pending ? ui.comments.sending[locale] : ui.comments.send[locale]}
    </button>
  );
}

export function CommentsSection({
  postId,
  locale,
  articleTitle,
}: {
  postId: string;
  locale: Locale;
  articleTitle: string;
}) {
  const [visitor, setVisitor] = useState("");
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [state, formAction] = useActionState<CommentResult | null, FormData>(submitComment, null);

  const muat = useCallback(async () => {
    const data = await listComments(postId);
    if (data === null) {
      setLoadFailed(true);
      return;
    }
    setLoadFailed(false);
    setComments(data);
  }, [postId]);

  useEffect(() => {
    setVisitor(visitorId());
    void muat();
  }, [muat]);

  // Komentar yang baru terkirim harus langsung terlihat; kalau tidak, pembaca
  // mengira kirimannya hilang dan menekan tombolnya berkali-kali.
  useEffect(() => {
    if (state?.ok) void muat();
  }, [state, muat]);

  const galat = state && !state.ok ? state.code : null;
  const pesanGalat = galat
    ? (ui.comments.errors[galat as keyof typeof ui.comments.errors] ?? ui.comments.errors.umum)[
        locale
      ]
    : null;

  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(
    `${ui.comments.reportSubject[locale]} — ${articleTitle}`,
  )}`;

  return (
    <section aria-labelledby="komentar" className="mt-12">
      <h2
        id="komentar"
        className="m-0 mb-6 font-serif text-[clamp(22px,3vw,28px)] font-semibold text-ink"
      >
        {ui.comments.title[locale]}
        {comments && comments.length > 0 ? (
          <span className="ml-2 font-sans text-[16px] font-normal text-muted">
            {comments.length}
          </span>
        ) : null}
      </h2>

      {/* ------------------------------------------------------- formulir */}
      <form action={formAction} className="mb-10 flex flex-col gap-4">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="visitor" value={visitor} />

        {/*
          Kolom umpan. Disembunyikan dari mata dan dari pembaca layar, tapi
          tetap ada di HTML — bot yang mengisi semua kolom akan mengisinya.
          tabIndex -1 dan aria-hidden menjaga pengguna keyboard tidak pernah
          mendarat di sini.
        */}
        <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="situs">Situs web</label>
          <input id="situs" name="situs" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {state?.ok ? (
          <p
            role="status"
            className="m-0 rounded-[10px] border border-green/30 bg-green/10 px-3.5 py-2.5 text-[14px] text-ink"
          >
            {ui.comments.sent[locale]}
          </p>
        ) : null}

        {pesanGalat ? (
          <p
            role="alert"
            className="m-0 rounded-[10px] border border-accent-strong/40 bg-accent/10 px-3.5 py-2.5 text-[14px] text-ink"
          >
            {pesanGalat}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="komentar-nama"
            className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em] text-ink"
          >
            {ui.comments.name[locale]}
          </label>
          <input
            id="komentar-nama"
            name="name"
            type="text"
            maxLength={60}
            autoComplete="name"
            placeholder={ui.comments.namePlaceholder[locale]}
            className={inputClasses}
          />
        </div>

        <div>
          <label
            htmlFor="komentar-isi"
            className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em] text-ink"
          >
            {ui.comments.body[locale]}
          </label>
          <textarea
            id="komentar-isi"
            name="body"
            rows={4}
            required
            maxLength={2000}
            placeholder={ui.comments.bodyPlaceholder[locale]}
            className={`${inputClasses} min-h-[110px] resize-y`}
          />
        </div>

        <div>
          <SubmitButton locale={locale} />
        </div>

        {/* Aturan, privasi, dan jalur pelaporan — competency 6. */}
        <div className="mt-2 rounded-[12px] border border-line bg-paper px-4 py-3.5">
          <p className="m-0 mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-accent-strong">
            {ui.comments.rulesTitle[locale]}
          </p>
          <p className="m-0 mb-2 text-[13px] leading-relaxed text-muted">
            {ui.comments.rules[locale]}
          </p>
          <p className="m-0 mb-2 text-[13px] leading-relaxed text-muted">
            {ui.comments.privacy[locale]}
          </p>
          <p className="m-0 text-[13px] leading-relaxed text-muted">
            {ui.comments.reportHint[locale]}{" "}
            <a href={mailto} className="text-accent-strong underline">
              {ui.comments.report[locale]}
            </a>
          </p>
        </div>
      </form>

      {/* --------------------------------------------------------- daftar */}
      {loadFailed ? (
        <p className="m-0 text-[14px] text-muted">{ui.comments.loadFailed[locale]}</p>
      ) : comments === null ? (
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
          {ui.comments.loading[locale]}
        </p>
      ) : comments.length === 0 ? (
        <p className="m-0 text-[14px] text-muted">{ui.comments.empty[locale]}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-6 p-0">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-line pt-5">
              <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[14.5px] font-semibold text-ink">
                  {c.author_name?.trim() || ui.comments.anonymous[locale]}
                </span>
                <time dateTime={c.created_at} className="font-mono text-[11.5px] text-muted">
                  {formatWaktu(c.created_at, locale)}
                </time>
              </div>
              <p className="m-0 whitespace-pre-line text-[15.5px] leading-relaxed text-ink/90">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
