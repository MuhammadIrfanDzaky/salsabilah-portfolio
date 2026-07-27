"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PostBody } from "@/components/blog/post-body";
import { Field, inputClasses } from "@/components/admin/field";
import { adminCopy } from "@/data/admin-copy";
import { saveArticle } from "@/app/admin/(dasbor)/artikel/actions";
import type { ActionResult } from "@/lib/admin/guard";
import { slugify } from "@/lib/slug";
import { utcIsoToWibInput } from "@/lib/time";
import { LIMITS, publishBlockers } from "@/lib/validation";

type CategoryOption = { id: string; name_id: string };

export type EditablePost = {
  id: string | null;
  slug: string;
  category_id: string;
  source_locale: string;
  status: string;
  translation_status: string;
  published_at: string | null;
  deleted_at: string | null;
  cover_path: string | null;
  title_id: string | null;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  body_id: string | null;
  body_en: string | null;
  cover_alt_id: string | null;
  cover_alt_en: string | null;
};

function ActionButton({
  intent,
  label,
  variant,
}: {
  intent: string;
  label: string;
  variant: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  const classes =
    variant === "primary"
      ? "bg-accent-strong text-on-accent"
      : "border border-line bg-surface text-ink";

  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      className={`inline-flex items-center rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-60 ${classes}`}
    >
      {pending ? adminCopy.editor.saving : label}
    </button>
  );
}

export function PostForm({
  post,
  categories,
}: {
  post: EditablePost;
  categories: CategoryOption[];
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveArticle, null);
  const errorBoxRef = useRef<HTMLDivElement>(null);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const failed = state && !state.ok ? state.message : null;

  // Fokus dipindahkan ke ringkasan galat setelah gagal simpan: tanpa ini,
  // pengguna keyboard tidak punya cara tahu bahwa ada yang salah di atas.
  useEffect(() => {
    if (failed) errorBoxRef.current?.focus();
  }, [failed, state]);

  const [sourceLocale, setSourceLocale] = useState(post.source_locale || "id");
  const [slug, setSlug] = useState(post.slug);
  const [bodyId, setBodyId] = useState(post.body_id ?? "");
  const [bodyEn, setBodyEn] = useState(post.body_en ?? "");
  const [titleId, setTitleId] = useState(post.title_id ?? "");
  const [titleEn, setTitleEn] = useState(post.title_en ?? "");
  const [publishedAt, setPublishedAt] = useState(utcIsoToWibInput(post.published_at));

  const kurang = publishBlockers({
    title_id: titleId,
    title_en: titleEn,
    body_id: bodyId,
    body_en: bodyEn,
    cover_path: post.cover_path,
    published_at: publishedAt ? "ada" : null,
    translation_status: post.translation_status,
  });

  const sourceTitle = sourceLocale === "en" ? titleEn : titleId;
  const previewBody = sourceLocale === "en" ? bodyEn : bodyId;

  function fillSlugFromTitle() {
    if (post.id) return; // slug artikel yang sudah ada tidak diubah diam-diam
    if (slug.trim().length > 0) return;
    if (!sourceTitle.trim()) return;
    setSlug(slugify(sourceTitle));
  }

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="postId" value={post.id ?? ""} />

      {failed ? (
        <div
          ref={errorBoxRef}
          tabIndex={-1}
          role="alert"
          className="rounded-[12px] border border-accent-strong/40 bg-accent/10 px-4 py-3 text-[14px] text-ink"
        >
          {failed}
        </div>
      ) : null}

      {state?.ok && state.message ? (
        <div
          role="status"
          className="rounded-[12px] border border-green/30 bg-green/10 px-4 py-3 text-[14px] text-ink"
        >
          {state.message}
        </div>
      ) : null}

      {/* ------------------------------------------------------- identitas */}
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
          {adminCopy.editor.groupIdentity}
        </legend>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="slug"
            label={adminCopy.editor.slug}
            hint={adminCopy.editor.slugHint}
            error={fields.slug}
          >
            {(props) => (
              <input
                {...props}
                name="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${inputClasses} font-mono`}
              />
            )}
          </Field>

          <Field id="categoryId" label={adminCopy.editor.category} error={fields.categoryId}>
            {(props) => (
              <select
                {...props}
                name="categoryId"
                defaultValue={post.category_id}
                className={inputClasses}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_id}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            id="sourceLocale"
            label={adminCopy.editor.sourceLocale}
            hint={adminCopy.editor.sourceLocaleHint}
            error={fields.sourceLocale}
          >
            {(props) => (
              <select
                {...props}
                name="sourceLocale"
                value={sourceLocale}
                onChange={(e) => setSourceLocale(e.target.value)}
                className={inputClasses}
              >
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            )}
          </Field>

          <Field
            id="publishedAtWib"
            label={adminCopy.editor.publishedAt}
            hint={adminCopy.editor.publishedAtHint}
            error={fields.publishedAt}
          >
            {(props) => (
              <input
                {...props}
                name="publishedAtWib"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputClasses}
              />
            )}
          </Field>
        </div>
      </fieldset>

      {/* ------------------------------------------------------ dua bahasa */}
      <div className="grid gap-8 lg:grid-cols-2">
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
            {adminCopy.editor.groupId}
            {sourceLocale === "id" ? " · sumber" : ""}
          </legend>

          <div className="flex flex-col gap-5">
            <Field id="titleId" label={adminCopy.editor.fieldTitle} error={fields.titleId}>
              {(props) => (
                <input
                  {...props}
                  name="titleId"
                  type="text"
                  maxLength={LIMITS.title}
                  value={titleId}
                  onChange={(e) => setTitleId(e.target.value)}
                  onBlur={fillSlugFromTitle}
                  className={inputClasses}
                />
              )}
            </Field>

            <Field id="excerptId" label={adminCopy.editor.fieldExcerpt} error={fields.excerptId}>
              {(props) => (
                <textarea
                  {...props}
                  name="excerptId"
                  rows={2}
                  maxLength={LIMITS.excerpt}
                  defaultValue={post.excerpt_id ?? ""}
                  className={`${inputClasses} resize-y`}
                />
              )}
            </Field>

            <Field
              id="bodyId"
              label={adminCopy.editor.fieldBody}
              hint={adminCopy.editor.bodyHint}
              error={fields.bodyId}
            >
              {(props) => (
                <textarea
                  {...props}
                  name="bodyId"
                  rows={16}
                  value={bodyId}
                  onChange={(e) => setBodyId(e.target.value)}
                  className={`${inputClasses} min-h-[280px] resize-y font-mono text-[14px] leading-relaxed`}
                />
              )}
            </Field>

            <Field id="coverAltId" label={adminCopy.editor.fieldCoverAlt} error={fields.coverAltId}>
              {(props) => (
                <input
                  {...props}
                  name="coverAltId"
                  type="text"
                  maxLength={LIMITS.coverAlt}
                  defaultValue={post.cover_alt_id ?? ""}
                  className={inputClasses}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
            {adminCopy.editor.groupEn}
            {sourceLocale === "en" ? " · sumber" : ""}
          </legend>

          <div className="flex flex-col gap-5">
            <Field id="titleEn" label={adminCopy.editor.fieldTitle} error={fields.titleEn}>
              {(props) => (
                <input
                  {...props}
                  name="titleEn"
                  type="text"
                  maxLength={LIMITS.title}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  onBlur={fillSlugFromTitle}
                  className={inputClasses}
                />
              )}
            </Field>

            <Field id="excerptEn" label={adminCopy.editor.fieldExcerpt} error={fields.excerptEn}>
              {(props) => (
                <textarea
                  {...props}
                  name="excerptEn"
                  rows={2}
                  maxLength={LIMITS.excerpt}
                  defaultValue={post.excerpt_en ?? ""}
                  className={`${inputClasses} resize-y`}
                />
              )}
            </Field>

            <Field
              id="bodyEn"
              label={adminCopy.editor.fieldBody}
              hint={adminCopy.editor.bodyHint}
              error={fields.bodyEn}
            >
              {(props) => (
                <textarea
                  {...props}
                  name="bodyEn"
                  rows={16}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  className={`${inputClasses} min-h-[280px] resize-y font-mono text-[14px] leading-relaxed`}
                />
              )}
            </Field>

            <Field id="coverAltEn" label={adminCopy.editor.fieldCoverAlt} error={fields.coverAltEn}>
              {(props) => (
                <input
                  {...props}
                  name="coverAltEn"
                  type="text"
                  maxLength={LIMITS.coverAlt}
                  defaultValue={post.cover_alt_en ?? ""}
                  className={inputClasses}
                />
              )}
            </Field>
          </div>
        </fieldset>
      </div>

      {/* -------------------------------------------------------- pratinjau */}
      {previewBody.trim() ? (
        <section className="rounded-[14px] border border-line bg-surface p-6">
          <h2 className="m-0 mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
            {adminCopy.editor.previewTitle}
          </h2>
          {/* Dirender lewat komponen yang sama dengan halaman publik, jadi yang
              terlihat di sini persis yang akan terbit — dan seperti di sana,
              tidak ada dangerouslySetInnerHTML di mana pun. */}
          <PostBody body={previewBody} />
        </section>
      ) : null}

      {/* ------------------------------------------------- syarat + tombol */}
      <section className="rounded-[14px] border border-line bg-surface p-6">
        <h2 className="m-0 mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
          {adminCopy.editor.checklistTitle}
        </h2>

        {kurang.length === 0 ? (
          <p className="m-0 mb-5 text-[14px] text-ink">{adminCopy.editor.checklistDone}</p>
        ) : (
          <ul className="m-0 mb-5 flex flex-wrap gap-x-5 gap-y-1.5 p-0 text-[13.5px] text-muted">
            {kurang.map((item) => (
              <li key={item} className="list-none">
                <span aria-hidden="true" className="mr-1.5 text-accent-strong">
                  ×
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <ActionButton intent="draft" label={adminCopy.editor.saveDraft} variant="ghost" />
          <ActionButton intent="schedule" label={adminCopy.editor.schedule} variant="ghost" />
          <ActionButton intent="publish" label={adminCopy.editor.publishNow} variant="primary" />
        </div>

        <p className="m-0 mt-3 text-[12.5px] leading-relaxed text-muted">
          {adminCopy.editor.publishNowHint}
        </p>

        {/* Daftar di atas hanya cermin. Yang benar-benar menolak terbit adalah
            CHECK constraint di database, jadi tombolnya sengaja tidak dinonaktifkan
            — kalau cermin ini keliru, database tetap yang memutuskan. */}
      </section>
    </form>
  );
}
