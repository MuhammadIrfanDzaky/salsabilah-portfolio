"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PostDoc } from "@/components/blog/post-doc";
import { RichEditor } from "@/components/admin/rich-editor";
import { sanitizeDoc, docToPlainText, type Doc } from "@/lib/doc";
import { Field, inputClasses } from "@/components/admin/field";
import { adminCopy } from "@/data/admin-copy";
import { saveArticle } from "@/app/admin/(dasbor)/artikel/actions";
import type { ActionResult } from "@/lib/admin/guard";
import type { Locale } from "@/lib/i18n";
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
  doc_id: unknown;
  doc_en: unknown;
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

/** Satu sisi bahasa di dalam pratinjau. */
function PreviewPane({
  legend,
  title,
  doc,
  locale,
  empty,
}: {
  legend: string;
  title: string;
  doc: Doc;
  locale: Locale;
  empty: string;
}) {
  const kosong = !title.trim() && doc.content.length === 0;
  return (
    <div>
      <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        {legend}
      </p>
      {kosong ? (
        <p className="m-0 text-[14px] text-muted">{empty}</p>
      ) : (
        <>
          {title.trim() ? (
            <h3 className="m-0 mb-4 font-serif text-[24px] font-semibold leading-[1.2] text-ink">
              {title}
            </h3>
          ) : null}
          <PostDoc doc={doc} locale={locale} />
        </>
      )}
    </div>
  );
}

export function PostForm({
  post,
  categories,
  coverUrl,
}: {
  post: EditablePost;
  categories: CategoryOption[];
  /** URL cover yang sudah tersimpan. Diturunkan di server; klien tidak tahu bentuk path Storage. */
  coverUrl?: string | null;
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Dokumen awal dihitung SEKALI. `initialDoc` hanya dibaca saat editor lahir;
  // memberinya nilai baru tiap render tidak berbahaya, tapi menyesatkan pembaca
  // kode berikutnya yang mengira isinya ikut tersinkron.
  const [docIdAwal] = useState<Doc>(() => sanitizeDoc(post.doc_id));
  const [docEnAwal] = useState<Doc>(() => sanitizeDoc(post.doc_en));
  const [docId, setDocId] = useState<Doc>(docIdAwal);
  const [docEn, setDocEn] = useState<Doc>(docEnAwal);

  // Cermin teks polos, dipakai cermin "Syarat terbit" dan pratinjau kosong.
  // Diturunkan, bukan disimpan terpisah — satu sumber kebenaran.
  const bodyId = docToPlainText(docId);
  const bodyEn = docToPlainText(docEn);
  const [titleId, setTitleId] = useState(post.title_id ?? "");
  const [titleEn, setTitleEn] = useState(post.title_en ?? "");
  const [publishedAt, setPublishedAt] = useState(utcIsoToWibInput(post.published_at));

  const kurang = publishBlockers({
    title_id: titleId,
    title_en: titleEn,
    body_id: bodyId,
    body_en: bodyEn,
    // Berkas yang baru dipilih ikut dihitung: cermin syarat terbit tidak boleh
    // menuduh "cover belum ada" padahal gambarnya sudah terpasang di formulir
    // dan akan terunggah pada simpan berikutnya.
    cover_path: post.cover_path ?? (coverFile ? "dipilih" : null),
    published_at: publishedAt ? "ada" : null,
    translation_status: post.translation_status,
  });

  const sourceTitle = sourceLocale === "en" ? titleEn : titleId;

  /**
   * Pratinjau cover: berkas yang baru dipilih menang atas yang sudah tersimpan.
   *
   * `URL.createObjectURL` menahan berkasnya di memori sampai dicabut, jadi
   * pencabutannya dijadwalkan pada pembersihan efek. Tanpa itu, memilih gambar
   * berkali-kali membocorkan satu berkas per pilihan.
   */
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!coverFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const coverPreview = objectUrl
    ? { url: objectUrl, baru: true }
    : coverUrl
      ? { url: coverUrl, baru: false }
      : null;

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
          {/* Cover menempati posisi yang dulu dipakai slug. Alasannya bukan
              estetika: gambar adalah keputusan yang diambil penulis di awal,
              sedangkan slug adalah detail teknis yang tidak perlu dilihat
              sampai artikelnya siap. */}
          <Field
            id="cover"
            label={adminCopy.editor.coverChoose}
            hint={adminCopy.editor.coverHint}
          >
            {(props) => (
              <div className="flex flex-col gap-3">
                {coverPreview ? (
                  <div className="overflow-hidden rounded-[10px] border border-line">
                    {/* Pratinjau lokal memakai <img> biasa, bukan next/image:
                        sumbernya blob: dari berkas yang belum terunggah, yang
                        tidak bisa dioptimasi loader mana pun. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview.url}
                      alt={coverPreview.baru ? adminCopy.editor.coverChosen : adminCopy.editor.coverCurrent}
                      className="h-auto w-full"
                    />
                  </div>
                ) : (
                  <p className="m-0 text-[14px] text-muted">{adminCopy.editor.coverNone}</p>
                )}
                <input
                  {...props}
                  name="cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  className={`${inputClasses} py-2`}
                />
              </div>
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
      {/*
        Sisi bahasa yang BUKAN sumber disembunyikan sampai Preview ditekan.
        Yang ditulis Salsabilah hanya satu bahasa; sisi satunya diisi mesin dan
        hanya perlu dilihat saat ditinjau, jadi menampilkannya sejak awal cuma
        menggandakan layar tanpa menambah pekerjaan yang bisa dia lakukan.

        Disembunyikan lewat atribut `hidden`, BUKAN dengan tidak merendernya.
        Bedanya menentukan: elemen yang tidak dirender tidak ikut dalam
        pengiriman formulir, sehingga terjemahan yang sudah ada akan terhapus
        diam-diam pada simpan berikutnya. `hidden` menyembunyikan dari layar dan
        dari urutan fokus, tapi nilainya tetap terkirim.
      */}
      {/* Satu kolom penuh saat hanya bahasa sumber yang tampil — kolom kedua
          yang kosong akan menyempitkan ruang menulis tanpa alasan. */}
      <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <fieldset className="m-0 border-0 p-0" hidden={!showPreview && sourceLocale !== "id"}>
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
              {() => <RichEditor name="docId" initialDoc={docIdAwal} onChange={setDocId} />}
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

        <fieldset className="m-0 border-0 p-0" hidden={!showPreview && sourceLocale !== "en"}>
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
              {() => <RichEditor name="docEn" initialDoc={docEnAwal} onChange={setDocEn} />}
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
      <section className="rounded-[14px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
            {adminCopy.editor.previewTitle}
          </h2>
          {/* type="button" wajib. Tanpa itu tombol di dalam <form> ikut mengirim
              formulir, dan menekan "Preview" akan menyimpan artikel. */}
          <button
            type="button"
            onClick={() => setShowPreview((on) => !on)}
            aria-expanded={showPreview}
            className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-[14px] font-semibold text-ink transition-opacity hover:opacity-85"
          >
            {showPreview ? adminCopy.editor.previewHide : adminCopy.editor.previewShow}
          </button>
        </div>

        {showPreview ? (
          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            {/* Dirender lewat komponen yang sama dengan halaman publik, jadi
                yang terlihat di sini persis yang akan terbit — dan seperti di
                sana, tidak ada dangerouslySetInnerHTML di mana pun. */}
            <PreviewPane
              legend={adminCopy.editor.groupId}
              title={titleId}
              doc={docId}
              locale="id"
              empty={adminCopy.editor.previewEmpty}
            />
            <PreviewPane
              legend={adminCopy.editor.groupEn}
              title={titleEn}
              doc={docEn}
              locale="en"
              empty={adminCopy.editor.previewEmpty}
            />
          </div>
        ) : (
          <p className="m-0 mt-3 text-[13px] text-muted">{adminCopy.editor.previewHint}</p>
        )}
      </section>

      {/* ------------------------------------------------------------ slug */}
      {/* Ditaruh paling bawah dengan sengaja. Slug adalah detail teknis yang
          terisi sendiri dari judul; menempatkannya di atas membuat layar
          pertama yang dilihat penulis diawali sesuatu yang bukan urusannya. */}
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-strong">
          {adminCopy.editor.groupAddress}
        </legend>
        <div className="md:max-w-[520px]">
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
        </div>
      </fieldset>

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
